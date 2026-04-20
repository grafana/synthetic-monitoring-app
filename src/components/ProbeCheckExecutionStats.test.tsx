import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { formatCheckRunsPerMinute, ProbeCheckExecutionStats } from './ProbeCheckExecutionStats';

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

const mockUseProbeExecutionStats = jest.fn();

jest.mock('data/useProbeExecutionStats', () => ({
  useProbeExecutionStats: (...args: unknown[]) => mockUseProbeExecutionStats(...args),
}));

describe('ProbeCheckExecutionStats', () => {
  beforeEach(() => {
    mockUseProbeExecutionStats.mockReturnValue({
      executionsPerSec: null,
      failuresPerSec: null,
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  it('renders both stat labels', async () => {
    render(<ProbeCheckExecutionStats probeName="test-probe" />);

    expect(await screen.findByText('Check runs / min')).toBeInTheDocument();
    expect(screen.getByText('Failed runs / min')).toBeInTheDocument();
  });

  it('shows em dash when there is no metric data', async () => {
    render(<ProbeCheckExecutionStats probeName="test-probe" />);

    const dashes = await screen.findAllByText('—');
    expect(dashes).toHaveLength(2);
  });

  it('renders formatted execution and failure rates', async () => {
    mockUseProbeExecutionStats.mockReturnValue({
      executionsPerSec: 0.5,
      failuresPerSec: 0.1,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProbeCheckExecutionStats probeName="test-probe" />);

    expect(await screen.findByText('30.0')).toBeInTheDocument();
    expect(screen.getByText('6.0')).toBeInTheDocument();
  });

  it('shows zero for failure rate when there are no failures', async () => {
    mockUseProbeExecutionStats.mockReturnValue({
      executionsPerSec: 0.5,
      failuresPerSec: 0,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProbeCheckExecutionStats probeName="test-probe" />);

    expect(await screen.findByText('30.0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

});
