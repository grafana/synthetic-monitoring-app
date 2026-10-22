import { DB } from 'test/db';

import { Recommendation, RecommendationId } from './Recommendations.types';
import { Check, CheckType } from 'types';

import {
  filterFindings,
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
      types: [CheckType.Http, CheckType.Dns],
    });
  });
});

describe('withFilters', () => {
  it('replaces the filter params and keeps every other param', () => {
    const params = withFilters(new URLSearchParams('category=alerting&type=ping'), {
      types: [CheckType.Http, CheckType.Dns],
    });

    expect(params.toString()).toBe('category=alerting&type=http&type=dns');
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
    const selection = { types: [CheckType.Http, CheckType.Ping] };

    expect(matchesRecommendationFilters(buildCheck(CheckType.Http), selection)).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Ping), selection)).toBe(true);
    expect(matchesRecommendationFilters(buildCheck(CheckType.Dns), selection)).toBe(false);
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
