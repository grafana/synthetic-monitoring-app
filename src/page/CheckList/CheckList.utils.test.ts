import { Label } from 'types';

import { splitLabels } from './CheckList.utils';

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
