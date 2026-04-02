import { Check, Label } from 'types';

import { getMissingCalNames, isCheckUnattributed, splitLabels } from './CheckList.utils';

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

const makeCheck = (labels: Label[]): Check =>
  ({ labels } as unknown as Check);

describe('isCheckUnattributed', () => {
  it('returns false when calNames is empty', () => {
    const check = makeCheck([{ name: 'env', value: 'prod' }]);
    expect(isCheckUnattributed(check, [])).toBe(false);
  });

  it('returns false when all CALs have non-empty values', () => {
    const check = makeCheck([
      { name: 'Team', value: 'platform' },
      { name: 'Service', value: 'api' },
    ]);
    expect(isCheckUnattributed(check, ['Team', 'Service'])).toBe(false);
  });

  it('returns true when a check has no CAL labels at all', () => {
    const check = makeCheck([{ name: 'env', value: 'prod' }]);
    expect(isCheckUnattributed(check, ['Team', 'Service'])).toBe(true);
  });

  it('returns true when some CALs are missing', () => {
    const check = makeCheck([{ name: 'Team', value: 'platform' }]);
    expect(isCheckUnattributed(check, ['Team', 'Service'])).toBe(true);
  });

  it('returns true when a CAL label exists but has an empty value', () => {
    const check = makeCheck([
      { name: 'Team', value: '' },
      { name: 'Service', value: 'api' },
    ]);
    expect(isCheckUnattributed(check, ['Team', 'Service'])).toBe(true);
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
