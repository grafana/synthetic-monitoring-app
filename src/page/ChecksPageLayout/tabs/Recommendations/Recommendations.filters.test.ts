import { DB } from 'test/db';

import { Recommendation, RecommendationId } from './Recommendations.types';
import { Check, CheckType, GrafanaFolder } from 'types';

import {
  filterFindings,
  getFolderOptions,
  getLabelOptions,
  getTypeOptions,
  matchesRecommendationFilters,
  NO_FILTERS,
  parseFilters,
  withFilters,
} from './Recommendations.filters';

const buildCheck = (type: CheckType, overrides: Partial<Check> = {}): Check =>
  DB.check.build(overrides, { transient: { type } });

describe('parseFilters', () => {
  it('reads repeated type params, ignoring values that are not check types', () => {
    expect(parseFilters(new URLSearchParams('type=http&type=dns&type=nonsense'))).toEqual({
      ...NO_FILTERS,
      types: [CheckType.Http, CheckType.Dns],
    });
  });
});

describe('parseFilters with labels and folders', () => {
  it('reads repeated label and folder params as they were written', () => {
    expect(
      parseFilters(new URLSearchParams('label=team%3A+core&label=url%3A+https%3A%2F%2Fa.com%2C+b&folder=f1'))
    ).toEqual({
      types: [],
      labels: ['team: core', 'url: https://a.com, b'],
      folders: ['f1'],
    });
  });
});

describe('withFilters', () => {
  it('replaces the filter params and keeps every other param', () => {
    const params = withFilters(new URLSearchParams('category=alerting&type=ping'), {
      ...NO_FILTERS,
      types: [CheckType.Http, CheckType.Dns],
    });

    expect(params.toString()).toBe('category=alerting&type=http&type=dns');
  });

  it('writes every group, each value its own param', () => {
    const params = withFilters(new URLSearchParams('category=cost'), {
      types: [CheckType.Http],
      labels: ['team: core', 'env: prod'],
      folders: ['f1'],
    });

    expect(params.getAll('type')).toEqual(['http']);
    expect(params.getAll('label')).toEqual(['team: core', 'env: prod']);
    expect(params.getAll('folder')).toEqual(['f1']);
    expect(params.get('category')).toBe('cost');
  });

  it('drops the filter params once nothing is selected', () => {
    expect(withFilters(new URLSearchParams('type=ping&finding=paused-checks'), NO_FILTERS).toString()).toBe(
      'finding=paused-checks'
    );
  });
});

describe('matchesRecommendationFilters', () => {
  it('matches every check while nothing is selected', () => {
    expect(matchesRecommendationFilters(buildCheck(CheckType.Grpc), NO_FILTERS)).toBe(true);
  });

  it('matches a check of any selected type', () => {
    const selection = { ...NO_FILTERS, types: [CheckType.Http, CheckType.Ping] };

    expect(matchesRecommendationFilters(buildCheck(CheckType.Http), selection)).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Ping), selection)).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Dns), selection)).toBe(false);
  });
});

describe('matchesRecommendationFilters across groups', () => {
  const core = { name: 'team', value: 'core' };

  it('needs a match in every group that has a selection', () => {
    const selection = { ...NO_FILTERS, types: [CheckType.Http], labels: ['team: core'] };

    expect(matchesRecommendationFilters(buildCheck(CheckType.Http, { labels: [core] }), selection)).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Http, { labels: [] }), selection)).toBe(false);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Ping, { labels: [core] }), selection)).toBe(false);
  });

  it('matches any selected label', () => {
    const selection = { ...NO_FILTERS, labels: ['team: core', 'env: prod'] };

    expect(
      matchesRecommendationFilters(buildCheck(CheckType.Http, { labels: [{ name: 'env', value: 'prod' }] }), selection)
    ).toBe(true);
  });

  it('puts a check without a folder in the default folder', () => {
    const selection = { ...NO_FILTERS, folders: ['default-uid'] };

    expect(
      matchesRecommendationFilters(buildCheck(CheckType.Http, { folderUid: undefined }), selection, 'default-uid')
    ).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Http, { folderUid: '' }), selection, 'default-uid')).toBe(
      true
    );
    expect(
      matchesRecommendationFilters(buildCheck(CheckType.Http, { folderUid: 'other' }), selection, 'default-uid')
    ).toBe(false);
  });
});

describe('filterFindings', () => {
  const isPing = (check: Check) => 'ping' in check.settings;

  it('keeps a finding none of whose checks match, with no checks left', () => {
    const finding: Recommendation = { id: RecommendationId.AlertingGaps, checks: [buildCheck(CheckType.Http)] };

    expect(filterFindings([finding], isPing)).toEqual([{ ...finding, checks: [], groups: undefined }]);
  });

  it('drops groups left empty and lists the types an overlapping group still has', () => {
    const http = buildCheck(CheckType.Http, { target: 'example.com' });
    const ping = buildCheck(CheckType.Ping, { target: 'example.com' });
    const dns = buildCheck(CheckType.Dns, { target: 'example.com' });
    const duplicates = [
      buildCheck(CheckType.Http, { target: 'a.com' }),
      buildCheck(CheckType.Http, { target: 'a.com' }),
    ];
    const finding: Recommendation = {
      id: RecommendationId.OverlappingTargets,
      checks: [http, ping, dns, ...duplicates],
      groups: [
        { key: 'example.com', label: 'example.com', detail: 'http, ping, dns', checks: [http, ping, dns] },
        { key: 'a.com', label: 'a.com', detail: 'http', type: CheckType.Http, checks: duplicates },
      ],
    };

    const [narrowed] = filterFindings([finding], (check) => check !== http && !duplicates.includes(check));

    expect(narrowed.checks).toEqual([ping, dns]);
    expect(narrowed.groups).toEqual([{ ...finding.groups![0], detail: 'ping, dns', checks: [ping, dns] }]);
  });

  it("keeps a duplicate group's type as its detail", () => {
    const [first, second] = [buildCheck(CheckType.Http), buildCheck(CheckType.Http)];
    const group = { key: 'k', label: 'a.com', detail: 'http', type: CheckType.Http, checks: [first, second] };
    const finding: Recommendation = { id: RecommendationId.DuplicateChecks, checks: [first, second], groups: [group] };

    expect(filterFindings([finding], (check) => check === first)[0].groups).toEqual([{ ...group, checks: [first] }]);
  });
});

describe('getTypeOptions', () => {
  it('lists each type once, sorted, plus any selected type no check has', () => {
    const checks = [buildCheck(CheckType.Ping), buildCheck(CheckType.Http), buildCheck(CheckType.Ping)];

    expect(getTypeOptions(checks, [CheckType.Grpc])).toEqual([CheckType.Grpc, CheckType.Http, CheckType.Ping]);
  });
});

describe('getLabelOptions', () => {
  it('lists each labelled value once, sorted, plus any selected label no check has', () => {
    const checks = [
      buildCheck(CheckType.Http, {
        labels: [
          { name: 'team', value: 'core' },
          { name: 'env', value: '' },
        ],
      }),
      buildCheck(CheckType.Http, {
        labels: [
          { name: 'team', value: 'core' },
          { name: 'env', value: 'prod' },
        ],
      }),
    ];

    expect(getLabelOptions(checks, ['owner: gone'])).toEqual(['env: prod', 'owner: gone', 'team: core']);
  });
});

describe('getFolderOptions', () => {
  const folder = (uid: string, title: string, parentUid?: string): GrafanaFolder => ({
    uid,
    title,
    url: '',
    parentUid,
  });
  const byUid = (...folders: GrafanaFolder[]) => new Map(folders.map((known) => [known.uid, known]));

  it('offers the default folder for a check with an empty folderUid', () => {
    const known = byUid(folder('default-uid', 'Synthetic Monitoring'));

    expect(getFolderOptions([buildCheck(CheckType.Http, { folderUid: '' })], 'default-uid', known, [])).toEqual([
      { value: 'default-uid', label: 'Synthetic Monitoring (default)' },
    ]);
  });

  it("lists the checks' folders once, titled where known, the default folder standing in for none", () => {
    const checks = [
      buildCheck(CheckType.Http, { folderUid: 'prod' }),
      buildCheck(CheckType.Http, { folderUid: undefined }),
      buildCheck(CheckType.Http, { folderUid: 'prod' }),
      buildCheck(CheckType.Http, { folderUid: 'untitled' }),
    ];
    const known = byUid(folder('default-uid', 'Synthetic Monitoring'), folder('prod', 'Production', 'default-uid'));

    expect(getFolderOptions(checks, 'default-uid', known, ['picked'])).toEqual([
      { value: 'picked', label: 'picked' },
      { value: 'prod', label: 'Production' },
      { value: 'default-uid', label: 'Synthetic Monitoring (default)' },
      { value: 'untitled', label: 'untitled' },
    ]);
  });

  it('marks the default folder, so a stray top-level copy of it reads differently', () => {
    const checks = [
      buildCheck(CheckType.Http, { folderUid: undefined }),
      buildCheck(CheckType.Http, { folderUid: 'copy' }),
    ];
    const known = byUid(folder('default-uid', 'Synthetic Monitoring'), folder('copy', 'Synthetic Monitoring'));

    expect(getFolderOptions(checks, 'default-uid', known, [])).toEqual([
      { value: 'copy', label: 'Synthetic Monitoring' },
      { value: 'default-uid', label: 'Synthetic Monitoring (default)' },
    ]);
  });

  it('tells folders sharing a title apart by their paths', () => {
    const checks = [
      buildCheck(CheckType.Http, { folderUid: 'a-prod' }),
      buildCheck(CheckType.Http, { folderUid: 'b-prod' }),
      buildCheck(CheckType.Http, { folderUid: 'a' }),
    ];
    const known = byUid(
      folder('root', 'SM'),
      folder('a', 'Team A', 'root'),
      folder('b', 'Team B', 'root'),
      folder('a-prod', 'prod', 'a'),
      folder('b-prod', 'prod', 'b')
    );

    expect(getFolderOptions(checks, 'root', known, [])).toEqual([
      { value: 'a-prod', label: 'SM > Team A > prod' },
      { value: 'b-prod', label: 'SM > Team B > prod' },
      { value: 'a', label: 'Team A' },
    ]);
  });
});
