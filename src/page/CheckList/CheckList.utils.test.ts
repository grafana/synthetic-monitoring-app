import { Check, Label } from 'types';
import { UNATTRIBUTED_SENTINEL } from 'page/CheckList/CheckList.constants';

import { defaultFilters, getMissingCalNames, matchesAllFilters, splitLabels } from './CheckList.utils';

describe('splitLabels', () => {
  it('returns all labels as customLabels when calNames is empty', () => {
    const labels: Label[] = [
      { name: 'env', value: 'prod' },
      { name: 'team', value: 'frontend' },
    ];

    const result = splitLabels(labels, []);
    expect(result.calLabels).toEqual([]);
    expect(result.customLabels).toEqual(labels);
  });

  it('returns all labels as calLabels when all names match', () => {
    const labels: Label[] = [
      { name: 'Team', value: 'frontend' },
      { name: 'Service', value: 'api' },
    ];

    const result = splitLabels(labels, ['Team', 'Service']);
    expect(result.calLabels).toEqual(labels);
    expect(result.customLabels).toEqual([]);
  });

  it('splits labels into calLabels and customLabels', () => {
    const labels: Label[] = [
      { name: 'Team', value: 'frontend' },
      { name: 'env', value: 'prod' },
      { name: 'Service', value: 'monitoring' },
    ];

    const result = splitLabels(labels, ['Team', 'Service']);
    expect(result.calLabels).toEqual([
      { name: 'Team', value: 'frontend' },
      { name: 'Service', value: 'monitoring' },
    ]);
    expect(result.customLabels).toEqual([{ name: 'env', value: 'prod' }]);
  });

  it('returns empty arrays when labels is empty', () => {
    const result = splitLabels([], ['Team', 'Service']);
    expect(result.calLabels).toEqual([]);
    expect(result.customLabels).toEqual([]);
  });

  it('is case-sensitive for label name matching', () => {
    const labels: Label[] = [{ name: 'team', value: 'frontend' }];

    const result = splitLabels(labels, ['Team']);
    expect(result.calLabels).toEqual([]);
    expect(result.customLabels).toEqual(labels);
  });
});

describe('getMissingCalNames', () => {
  it('returns all calNames when no labels match', () => {
    const labels: Label[] = [{ name: 'env', value: 'prod' }];
    expect(getMissingCalNames(labels, ['Team', 'Service'])).toEqual(['Team', 'Service']);
  });

  it('returns empty array when all CALs are present with values', () => {
    const labels: Label[] = [
      { name: 'Team', value: 'platform' },
      { name: 'Service', value: 'api' },
    ];
    expect(getMissingCalNames(labels, ['Team', 'Service'])).toEqual([]);
  });

  it('returns only the missing CAL names', () => {
    const labels: Label[] = [{ name: 'Team', value: 'platform' }];
    expect(getMissingCalNames(labels, ['Team', 'Service'])).toEqual(['Service']);
  });

  it('treats empty-value labels as missing', () => {
    const labels: Label[] = [
      { name: 'Team', value: '' },
      { name: 'Service', value: 'api' },
    ];
    expect(getMissingCalNames(labels, ['Team', 'Service'])).toEqual(['Team']);
  });

  it('returns empty array when calNames is empty', () => {
    const labels: Label[] = [{ name: 'env', value: 'prod' }];
    expect(getMissingCalNames(labels, [])).toEqual([]);
  });
});

describe('matchesAllFilters - unattributed label filter', () => {
  const makeCheck = (labels: Label[]): Check =>
    ({
      id: 1,
      job: 'test',
      target: 'https://example.com',
      labels,
      probes: [],
      settings: { http: {} },
      enabled: true,
      alertSensitivity: 'none',
    } as unknown as Check);

  const filtersWithLabels = (labels: string[]) => ({
    ...defaultFilters,
    labels,
  });

  it('matches a check missing the CAL label entirely', () => {
    const check = makeCheck([{ name: 'env', value: 'prod' }]);
    expect(matchesAllFilters(check, filtersWithLabels([`Team: ${UNATTRIBUTED_SENTINEL}`]))).toBe(true);
  });

  it('matches a check with the CAL label but an empty value', () => {
    const check = makeCheck([{ name: 'Team', value: '' }]);
    expect(matchesAllFilters(check, filtersWithLabels([`Team: ${UNATTRIBUTED_SENTINEL}`]))).toBe(true);
  });

  it('does not match a check with the CAL label and a non-empty value', () => {
    const check = makeCheck([{ name: 'Team', value: 'frontend' }]);
    expect(matchesAllFilters(check, filtersWithLabels([`Team: ${UNATTRIBUTED_SENTINEL}`]))).toBe(false);
  });

  it('matches when combining unattributed filter with regular label filter (OR logic)', () => {
    const check = makeCheck([{ name: 'env', value: 'prod' }]);
    expect(matchesAllFilters(check, filtersWithLabels([`Team: ${UNATTRIBUTED_SENTINEL}`, 'env: prod']))).toBe(true);
  });

  it('regular label filter still works alongside unattributed', () => {
    const check = makeCheck([{ name: 'Team', value: 'frontend' }]);
    expect(matchesAllFilters(check, filtersWithLabels(['Team: frontend']))).toBe(true);
  });
});
