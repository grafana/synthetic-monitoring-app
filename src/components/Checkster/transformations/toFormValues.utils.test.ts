import { partitionCalLabels } from './toFormValues.utils';

describe('partitionCalLabels', () => {
  it('returns no CAL rows and keeps every label when the tenant has no CALs configured', () => {
    const labels = [{ name: 'env', value: 'production' }];

    expect(partitionCalLabels(labels, [])).toEqual({
      calLabels: [],
      labels,
    });
  });

  it('moves CAL-named labels out of labels and into calLabels', () => {
    const result = partitionCalLabels(
      [
        { name: 'Team', value: 'team-a' },
        { name: 'env', value: 'production' },
      ],
      ['Team']
    );

    expect(result).toEqual({
      calLabels: [{ name: 'Team', value: 'team-a' }],
      labels: [{ name: 'env', value: 'production' }],
    });
  });

  it('creates a blank row for a configured CAL the check has no value for', () => {
    const result = partitionCalLabels([{ name: 'Team', value: 'team-a' }], ['Team', 'Service']);

    expect(result.calLabels).toEqual([
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: '' },
    ]);
  });

  it('orders CAL rows by the tenant CAL names, not by the order on the check', () => {
    const result = partitionCalLabels(
      [
        { name: 'Service', value: 'service-a' },
        { name: 'Team', value: 'team-a' },
      ],
      ['Team', 'Service']
    );

    expect(result.calLabels).toEqual([
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: 'service-a' },
    ]);
  });

  it('keeps the value of a CAL that is still configured when another CAL is removed', () => {
    const check = [
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: 'service-a' },
    ];

    expect(partitionCalLabels(check, ['Team'])).toEqual({
      calLabels: [{ name: 'Team', value: 'team-a' }],
      labels: [{ name: 'Service', value: 'service-a' }],
    });
  });

  it('treats a de-configured CAL as a custom label rather than discarding it', () => {
    const result = partitionCalLabels([{ name: 'Service', value: 'service-a' }], ['Team']);

    expect(result.labels).toEqual([{ name: 'Service', value: 'service-a' }]);
  });

  it('handles a check with no labels', () => {
    expect(partitionCalLabels(undefined, ['Team'])).toEqual({
      calLabels: [{ name: 'Team', value: '' }],
      labels: [],
    });
  });
});
