import { groupLabelsByCalNames } from './toFormValues.utils';

describe('groupLabelsByCalNames', () => {
  it('returns a row per cost attribution name, in the order the tenant defines them', () => {
    const result = groupLabelsByCalNames([{ name: 'Service', value: 'service-a' }], ['Team', 'Service']);

    expect(result.calLabels).toEqual([
      { name: 'Team', value: '' },
      { name: 'Service', value: 'service-a' },
    ]);
  });

  it('leaves a cost attribution value blank when the check does not set it', () => {
    const result = groupLabelsByCalNames([], ['Team']);

    expect(result.calLabels).toEqual([{ name: 'Team', value: '' }]);
  });

  it('removes cost attribution labels from the custom labels', () => {
    const result = groupLabelsByCalNames(
      [
        { name: 'Team', value: 'team-a' },
        { name: 'env', value: 'production' },
      ],
      ['Team']
    );

    expect(result.labels).toEqual([{ name: 'env', value: 'production' }]);
  });

  it('keeps every label as a custom label when the tenant has no cost attribution names', () => {
    const labels = [
      { name: 'Team', value: 'team-a' },
      { name: 'env', value: 'production' },
    ];

    expect(groupLabelsByCalNames(labels, [])).toEqual({ calLabels: [], labels });
  });
});
