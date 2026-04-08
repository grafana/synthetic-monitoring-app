import { formatCheckRunsPerMinute } from './ProbeCheckExecutionStats';

describe('formatCheckRunsPerMinute', () => {
  it('returns em dash for null', () => {
    expect(formatCheckRunsPerMinute(null)).toBe('—');
  });

  it('returns em dash for NaN', () => {
    expect(formatCheckRunsPerMinute(Number.NaN)).toBe('—');
  });

  it('returns 0 for zero rate', () => {
    expect(formatCheckRunsPerMinute(0)).toBe('0');
  });

  it('formats fractional per-minute rates', () => {
    expect(formatCheckRunsPerMinute(1 / 60)).toBe('1.0');
    expect(formatCheckRunsPerMinute(0.01 / 60)).toBe('0.01');
  });

  it('rounds large per-minute rates', () => {
    expect(formatCheckRunsPerMinute(10)).toBe('600');
  });
});
