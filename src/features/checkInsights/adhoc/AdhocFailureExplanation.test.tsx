import React from 'react';
import { useAssistant, useInlineAssistant, useLimits, useTerms } from '@grafana/assistant';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { AdHocCheckState, ProbeStateStatus } from 'components/Checkster/feature/adhoc-check/types.adhoc-check';

import { AdhocFailureExplanation } from './AdhocFailureExplanation';

// The shared @grafana/assistant mock doesn't cover the inline-completion hooks.
jest.mock('@grafana/assistant', () => ({
  useAssistant: jest.fn(),
  useTerms: jest.fn(),
  useLimits: jest.fn(),
  useInlineAssistant: jest.fn(),
}));

const check = { job: 'Agentic journey', target: 'https://grafana.com/' };

const failedRun: AdHocCheckState = {
  id: 'run-1',
  created: {} as AdHocCheckState['created'],
  checkTimeoutInSeconds: 30,
  probeState: {
    Paris: {
      id: 1,
      name: 'Paris',
      public: true,
      state: ProbeStateStatus.Success,
      timeseries: [{ name: 'probe_success', help: '', type: 1, metric: [{ gauge: { value: 0 } }] }],
      logs: [{ level: 'error', msg: 'browser-ai: assertion not met: the dashboard is showing', time: '1' }],
    },
  },
};

const generate = jest.fn();

beforeEach(() => {
  generate.mockReset();
  jest.mocked(useAssistant).mockReturnValue({ isAvailable: true, isLoading: false } as ReturnType<typeof useAssistant>);
  jest.mocked(useTerms).mockReturnValue({ accepted: true, loading: false, error: null } as ReturnType<typeof useTerms>);
  jest
    .mocked(useLimits)
    .mockReturnValue({ isLimitReached: false, loading: false, error: null } as ReturnType<typeof useLimits>);
  jest.mocked(useInlineAssistant).mockReturnValue({ generate } as unknown as ReturnType<typeof useInlineAssistant>);
});

it('shows nothing when the run passed', () => {
  const passed = {
    ...failedRun,
    probeState: {
      Paris: {
        ...failedRun.probeState.Paris,
        timeseries: [{ name: 'probe_success', help: '', type: 1, metric: [{ gauge: { value: 1 } }] }],
      },
    },
  };
  render(<AdhocFailureExplanation run={passed} check={check} />);
  expect(screen.queryByRole('status', { name: 'Test failure summary' })).not.toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('explains the failure, grounded in the evidence', async () => {
  generate.mockImplementation(({ onComplete }) => onComplete('The dashboard never appeared after signing in.'));
  render(<AdhocFailureExplanation run={failedRun} check={check} />);

  expect(await screen.findByText('The dashboard never appeared after signing in.')).toBeInTheDocument();
  expect(screen.getByText('Failing from: Paris')).toBeInTheDocument();
  expect(screen.getByText('error: browser-ai: assertion not met: the dashboard is showing')).toBeInTheDocument();
  expect(generate).toHaveBeenCalledTimes(1);
  expect(generate.mock.calls[0][0].prompt).toContain('assertion not met: the dashboard is showing');
});

it('still shows the evidence and says why when Assistant is unavailable', async () => {
  jest
    .mocked(useAssistant)
    .mockReturnValue({ isAvailable: false, isLoading: false } as ReturnType<typeof useAssistant>);
  render(<AdhocFailureExplanation run={failedRun} check={check} />);

  expect(await screen.findByText('Grafana Assistant is not available.')).toBeInTheDocument();
  expect(screen.getByText('Failing from: Paris')).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('does not generate when the usage limit is reached', async () => {
  jest
    .mocked(useLimits)
    .mockReturnValue({ isLimitReached: true, loading: false, error: null } as ReturnType<typeof useLimits>);
  render(<AdhocFailureExplanation run={failedRun} check={check} />);

  expect(await screen.findByText("Grafana Assistant's usage limit has been reached.")).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('reports a failed generation instead of showing nothing', async () => {
  generate.mockImplementation(({ onError }) => onError(new Error('boom')));
  render(<AdhocFailureExplanation run={failedRun} check={check} />);

  await waitFor(() => expect(screen.getByText("Couldn't generate an explanation right now.")).toBeInTheDocument());
});
