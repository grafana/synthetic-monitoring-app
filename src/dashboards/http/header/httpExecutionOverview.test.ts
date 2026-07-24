import { formatHttpExecutionOverviewExtra } from './httpExecutionOverview';

describe('formatHttpExecutionOverviewExtra', () => {
  it('formats successful of total when both values are present', () => {
    expect(formatHttpExecutionOverviewExtra(706, 377)).toBe('377 of 706 succeeded');
  });

  it('returns undefined when either value is missing', () => {
    expect(formatHttpExecutionOverviewExtra(null, 377)).toBeUndefined();
    expect(formatHttpExecutionOverviewExtra(706, null)).toBeUndefined();
  });
});
