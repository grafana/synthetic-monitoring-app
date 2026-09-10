import { DB } from 'test/db';

import { RecommendationId } from './Recommendations.types';
import { AlertSensitivity, Check, CheckAlertType, CheckType } from 'types';

import { computeRecommendations } from './Recommendations.utils';

function buildCheck(overrides: Partial<Check>, type = CheckType.Http): Check {
  return DB.check.build(
    {
      alertSensitivity: AlertSensitivity.None,
      alerts: [],
      enabled: true,
      labels: [],
      ...overrides,
    },
    { transient: { type } }
  );
}

function findingIds(checks: Check[], calNames: string[] = []) {
  return computeRecommendations({ checks, calNames }).map(({ id }) => id);
}

function finding(id: RecommendationId, checks: Check[], calNames: string[] = []) {
  return computeRecommendations({ checks, calNames }).find((recommendation) => recommendation.id === id);
}

describe('alerting gaps', () => {
  it('flags a running check with no alerting of either kind', () => {
    const check = buildCheck({ job: 'unalerted' });

    expect(finding(RecommendationId.AlertingGaps, [check])?.checks).toEqual([check]);
  });

  it('ignores checks covered by per-check alerts or by a legacy sensitivity', () => {
    const perCheckAlerts = buildCheck({
      job: 'per-check',
      alerts: [DB.alert.build({ name: CheckAlertType.ProbeFailedExecutionsTooHigh })],
    });
    const legacySensitivity = buildCheck({ job: 'legacy', alertSensitivity: AlertSensitivity.Medium });

    expect(findingIds([perCheckAlerts, legacySensitivity])).not.toContain(RecommendationId.AlertingGaps);
  });

  it('leaves paused checks to the paused finding rather than counting them twice', () => {
    const paused = buildCheck({ job: 'paused', enabled: false });

    const ids = findingIds([paused]);

    expect(ids).toContain(RecommendationId.PausedChecks);
    expect(ids).not.toContain(RecommendationId.AlertingGaps);
  });
});

describe('missing cost attribution labels', () => {
  const calNames = ['team', 'service'];

  it('flags a check missing any one of the tenant cost labels', () => {
    const partial = buildCheck({ job: 'partial', labels: [{ name: 'team', value: 'sm' }] });

    expect(finding(RecommendationId.MissingCostLabels, [partial], calNames)?.checks).toEqual([partial]);
  });

  it('treats an empty label value as missing', () => {
    const blank = buildCheck({
      job: 'blank',
      labels: [
        { name: 'team', value: '' },
        { name: 'service', value: 'api' },
      ],
    });

    expect(finding(RecommendationId.MissingCostLabels, [blank], calNames)?.checks).toEqual([blank]);
  });

  it('ignores fully attributed checks', () => {
    const attributed = buildCheck({
      job: 'attributed',
      labels: [
        { name: 'team', value: 'sm' },
        { name: 'service', value: 'api' },
      ],
    });

    expect(findingIds([attributed], calNames)).not.toContain(RecommendationId.MissingCostLabels);
  });

  it('says nothing when the tenant has no cost labels configured', () => {
    const unlabelled = buildCheck({ job: 'unlabelled' });

    expect(findingIds([unlabelled], [])).not.toContain(RecommendationId.MissingCostLabels);
  });
});

describe('redundant checks', () => {
  it('groups checks that share a target and a type as duplicates', () => {
    const first = buildCheck({ job: 'first', target: 'https://grafana.com' });
    const second = buildCheck({ job: 'second', target: 'https://grafana.com' });
    const elsewhere = buildCheck({ job: 'elsewhere', target: 'https://example.com' });

    const groups = finding(RecommendationId.DuplicateChecks, [first, second, elsewhere])?.groups;

    expect(groups).toHaveLength(1);
    expect(groups?.[0]).toMatchObject({ label: 'https://grafana.com', detail: CheckType.Http });
    expect(groups?.[0].checks).toEqual([first, second]);
  });

  it('does not treat one check per target as a duplicate', () => {
    const checks = [
      buildCheck({ job: 'a', target: 'https://a.com' }),
      buildCheck({ job: 'b', target: 'https://b.com' }),
    ];

    expect(findingIds(checks)).not.toContain(RecommendationId.DuplicateChecks);
  });

  it('reports a target covered by more than one check type as overlapping', () => {
    const http = buildCheck({ job: 'http', target: 'grafana.com' }, CheckType.Http);
    const ping = buildCheck({ job: 'ping', target: 'grafana.com' }, CheckType.Ping);

    const groups = finding(RecommendationId.OverlappingTargets, [http, ping])?.groups;

    expect(groups).toHaveLength(1);
    expect(groups?.[0].label).toBe('grafana.com');
    expect(groups?.[0].detail).toContain(CheckType.Ping);
  });

  it('does not report overlap when the duplicates are all the same type', () => {
    const checks = [buildCheck({ job: 'a', target: 'grafana.com' }), buildCheck({ job: 'b', target: 'grafana.com' })];

    expect(findingIds(checks)).not.toContain(RecommendationId.OverlappingTargets);
  });

  it('puts the largest group first so the biggest clean-up leads', () => {
    const checks = [
      buildCheck({ job: 'pair-1', target: 'https://pair.com' }),
      buildCheck({ job: 'pair-2', target: 'https://pair.com' }),
      buildCheck({ job: 'trio-1', target: 'https://trio.com' }),
      buildCheck({ job: 'trio-2', target: 'https://trio.com' }),
      buildCheck({ job: 'trio-3', target: 'https://trio.com' }),
    ];

    const groups = finding(RecommendationId.DuplicateChecks, checks)?.groups;

    expect(groups?.map(({ label }) => label)).toEqual(['https://trio.com', 'https://pair.com']);
  });
});

describe('paused checks', () => {
  it('puts the checks untouched for longest first, and those without a timestamp last', () => {
    const recent = buildCheck({ job: 'recent', enabled: false, modified: 3_000 });
    const forgotten = buildCheck({ job: 'forgotten', enabled: false, modified: 1_000 });
    const undated = buildCheck({ job: 'undated', enabled: false, modified: undefined });

    const [finding] = computeRecommendations({ checks: [recent, undated, forgotten], calNames: [] });

    expect(finding.id).toBe(RecommendationId.PausedChecks);
    expect(finding.checks.map((check) => check.job)).toEqual(['forgotten', 'recent', 'undated']);
  });
});

describe('the finding list as a whole', () => {
  it('is empty for a well configured fleet', () => {
    const healthy = buildCheck({
      job: 'healthy',
      target: 'https://grafana.com',
      alertSensitivity: AlertSensitivity.High,
      labels: [{ name: 'team', value: 'sm' }],
    });

    expect(computeRecommendations({ checks: [healthy], calNames: ['team'] })).toEqual([]);
  });

  it('leads with the gap that lets failures go unnoticed, then cleanup', () => {
    const unalerted = buildCheck({ job: 'unalerted', target: 'https://a.com' });
    const paused = buildCheck({ job: 'paused', target: 'https://b.com', enabled: false });

    expect(findingIds([unalerted, paused])).toEqual([RecommendationId.AlertingGaps, RecommendationId.PausedChecks]);
  });
});
