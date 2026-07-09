import React from 'react';
import { screen } from '@testing-library/react';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckType } from 'types';
import { FrontendO11yButton } from 'scenes/components/TimepointExplorer/FrontendO11yButton';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { RumAvailability } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

const mockUseFaroSessionLink = jest.fn();
const mockMarkRumPresent = jest.fn();
const mockUseStatefulTimepoint = jest.fn();
const mockUseSelectedProbeNames = jest.fn();

jest.mock('scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks', () => ({
  useFaroSessionLink: (args: unknown) => mockUseFaroSessionLink(args),
}));

jest.mock('scenes/components/TimepointExplorer/TimepointExplorer.hooks', () => ({
  useStatefulTimepoint: (timepoint: unknown) => mockUseStatefulTimepoint(timepoint),
  useSelectedProbeNames: (timepoint: unknown) => mockUseSelectedProbeNames(timepoint),
}));

jest.mock('hooks/useLogsDS', () => ({
  useLogsDS: () => ({ uid: 'loki-uid' }),
}));

const timepoint: StatelessTimepoint = {
  adjustedTime: 1_700_000_000_000,
  timepointDuration: 1_000,
  index: 0,
  config: {
    frequency: 60_000,
    from: 1_700_000_000_000,
    to: 1_700_000_060_000,
  },
};

jest.mock('scenes/components/TimepointExplorer/TimepointExplorer.context', () => ({
  useTimepointExplorerContext: jest.fn(),
}));

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';

const mockedUseTimepointExplorerContext = useTimepointExplorerContext as jest.Mock;

function setupContext({
  rumAvailability = 'unknown' as RumAvailability,
  viewerState = [timepoint, 'probe-a', 0] as const,
  currentAdjustedTime = timepoint.adjustedTime + 60_000,
} = {}) {
  mockedUseTimepointExplorerContext.mockReturnValue({
    check: COMPLEX_BROWSER_CHECK,
    checkType: CheckType.Browser,
    viewerState,
    rumAvailability,
    markRumPresent: mockMarkRumPresent,
    currentAdjustedTime,
  });
}

describe('FrontendO11yButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelectedProbeNames.mockReturnValue(['probe-a']);
    mockUseStatefulTimepoint.mockReturnValue({
      ...timepoint,
      status: 'success',
      maxProbeDuration: 1000,
      probeResults: {
        'probe-a': [{ labels: { execution_id: 'exec-1' } }],
      },
    });
    setupContext();
  });

  it('renders the session link when a Faro session is available', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: { href: '/a/grafana-kowalski-app/apps/2/sessions/abc', appId: '2', sessionId: 'abc' },
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: false,
      isSuccess: true,
    });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(await screen.findByRole('link', { name: /view frontend session/i })).toHaveAttribute(
      'href',
      '/a/grafana-kowalski-app/apps/2/sessions/abc'
    );
  });

  it('shows Add RUM when the lookup succeeds empty and RUM is not known present', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: false,
      isSuccess: true,
    });
    setupContext({ rumAvailability: 'unknown' });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(await screen.findByText('Add RUM to your app')).toBeInTheDocument();
  });

  it('shows No session for this run when RUM is present but this execution has none', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: false,
      isSuccess: true,
    });
    setupContext({ rumAvailability: 'present' });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(await screen.findByText('No session for this run')).toBeInTheDocument();
    expect(screen.queryByText('Add RUM to your app')).not.toBeInTheDocument();
  });

  it('shows Waiting for session while Faro lookup is in flight and RUM is present', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isFetched: false,
      isError: false,
      isSuccess: false,
    });
    setupContext({ rumAvailability: 'present' });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(await screen.findByText('Waiting for session')).toBeInTheDocument();
  });

  it('shows Waiting for session when the selected probe is pending and RUM is present', async () => {
    mockUseStatefulTimepoint.mockReturnValue({
      ...timepoint,
      status: 'pending',
      maxProbeDuration: 1000,
      probeResults: {},
    });
    mockUseFaroSessionLink.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isFetched: false,
      isError: false,
      isSuccess: false,
    });
    setupContext({
      rumAvailability: 'present',
      currentAdjustedTime: timepoint.adjustedTime,
    });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(await screen.findByText('Waiting for session')).toBeInTheDocument();
  });

  it('renders nothing when the Faro lookup errors', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: true,
      isSuccess: false,
    });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(screen.queryByText('Add RUM to your app')).not.toBeInTheDocument();
    expect(screen.queryByText('No session for this run')).not.toBeInTheDocument();
    expect(screen.queryByText('Waiting for session')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view frontend session/i })).not.toBeInTheDocument();
  });

  it('renders a spinner while the Faro lookup is in flight and RUM is not present', async () => {
    mockUseFaroSessionLink.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isFetched: false,
      isError: false,
      isSuccess: false,
    });
    setupContext({ rumAvailability: 'unknown' });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(screen.queryByText('Add RUM to your app')).not.toBeInTheDocument();
    expect(screen.queryByText('No session for this run')).not.toBeInTheDocument();
    expect(screen.queryByText('Waiting for session')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view frontend session/i })).not.toBeInTheDocument();
  });

  it('renders nothing when the selected execution has no execution id', async () => {
    mockUseStatefulTimepoint.mockReturnValue({
      ...timepoint,
      status: 'success',
      maxProbeDuration: 1000,
      probeResults: {
        'probe-a': [{ labels: {} }],
      },
    });
    mockUseFaroSessionLink.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isFetched: false,
      isError: false,
      isSuccess: false,
    });

    render(<FrontendO11yButton timepoint={timepoint} />);

    expect(screen.queryByText('Add RUM to your app')).not.toBeInTheDocument();
    expect(screen.queryByText('No session for this run')).not.toBeInTheDocument();
    expect(screen.queryByText('Waiting for session')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view frontend session/i })).not.toBeInTheDocument();
  });
});
