import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { llm } from '@grafana/llm';
import { screen, waitFor } from '@testing-library/react';
import { FailureLogLine } from 'features/checkInsights/fetchRecentFailureLogLines';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { SM_META } from 'test/fixtures/meta';
import { render } from 'test/render';

import { Check } from 'types';
import { MetricCheckSuccess } from 'datasource/responses.types';
import { CheckRuntimeAlertStates } from 'data/useCheckAlertStates';

import { CheckFailureExplanation } from './CheckFailureExplanation';

// The component renders nothing unless the org has opted in via Settings (see
// AiCheckExplanationsSetting/useCheckFailureExplanation), so every test needing it visible
// renders with that setting on; the one test that cares about it being off says so explicitly.
function renderExplanation(check: Check, { aiCheckExplanationsEnabled = true } = {}) {
  return render(<CheckFailureExplanation check={check} />, {
    meta: { jsonData: { ...SM_META.jsonData, aiCheckExplanationsEnabled } },
  });
}

jest.mock('data/useCheckAlertStates', () => {
  const actual = jest.requireActual('data/useCheckAlertStates');
  return {
    ...actual,
    useChecksAlertStates: jest.fn(),
  };
});

jest.mock('data/useSuccessRates', () => {
  const actual = jest.requireActual('data/useSuccessRates');
  return {
    ...actual,
    useCheckReachabilitySuccessRate: jest.fn(),
  };
});

jest.mock('@grafana/llm', () => ({
  llm: {
    enabled: jest.fn(),
    chatCompletions: jest.fn(),
    Model: { BASE: 'base', LARGE: 'large' },
  },
}));

jest.mock('features/checkInsights/fetchRecentFailureLogLines', () => ({
  fetchRecentFailureLogLines: jest.fn(),
}));

const { useChecksAlertStates } = jest.requireMock('data/useCheckAlertStates') as {
  useChecksAlertStates: jest.MockedFunction<() => Partial<UseQueryResult<CheckRuntimeAlertStates>>>;
};

const { useCheckReachabilitySuccessRate } = jest.requireMock('data/useSuccessRates') as {
  useCheckReachabilitySuccessRate: jest.MockedFunction<() => Partial<UseQueryResult<MetricCheckSuccess>>>;
};

const { fetchRecentFailureLogLines } = jest.requireMock('features/checkInsights/fetchRecentFailureLogLines') as {
  fetchRecentFailureLogLines: jest.MockedFunction<() => Promise<FailureLogLine[]>>;
};

function mockReachability(fraction: number | undefined) {
  useCheckReachabilitySuccessRate.mockReturnValue({
    data: fraction === undefined ? undefined : ({ value: [0, String(fraction)] } as MetricCheckSuccess),
    isLoading: false,
  } as any);
}

function mockAlertStates(firingAlertNames: string[] = []) {
  useChecksAlertStates.mockReturnValue({
    data: {
      [`${BASIC_HTTP_CHECK.job}\0${BASIC_HTTP_CHECK.target}`]: {
        firingCount: firingAlertNames.length,
        firingAlertNames: new Set(firingAlertNames),
      },
    },
    isLoading: false,
  } as any);
}

beforeEach(() => {
  jest.mocked(llm.chatCompletions).mockReset();
  jest.mocked(llm.enabled).mockReset();
  fetchRecentFailureLogLines.mockReset().mockResolvedValue([]);
});

it('renders nothing, without calling the LLM, for a healthy check', async () => {
  mockReachability(1);
  mockAlertStates([]);
  renderExplanation(BASIC_HTTP_CHECK);

  await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
  expect(screen.queryByText(/healthy|failing|alert firing/i)).not.toBeInTheDocument();
  await waitFor(() => expect(llm.enabled).not.toHaveBeenCalled());
});

it('shows a failing status without an AI explanation when the org has not enabled the setting', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  jest.mocked(llm.enabled).mockResolvedValue(true);

  renderExplanation(BASIC_HTTP_CHECK, { aiCheckExplanationsEnabled: false });

  expect(await screen.findByText('Alert firing')).toBeInTheDocument();
  await waitFor(() => expect(llm.enabled).not.toHaveBeenCalled());
  expect(screen.queryByText(/investigating/i)).not.toBeInTheDocument();
});

it('shows a failing status without an AI explanation when the Grafana LLM app is not configured', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  jest.mocked(llm.enabled).mockResolvedValue(false);

  renderExplanation(BASIC_HTTP_CHECK);

  expect(await screen.findByText('Failing')).toBeInTheDocument();
  await waitFor(() => expect(llm.enabled).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByText(/investigating/i)).not.toBeInTheDocument());
  expect(llm.chatCompletions).not.toHaveBeenCalled();
});

it('shows the analyzing state while the request is in flight, then the resolved explanation', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  jest.mocked(llm.enabled).mockResolvedValue(true);

  let resolveChatCompletions: (value: any) => void = () => {};
  jest.mocked(llm.chatCompletions).mockReturnValue(
    new Promise((resolve) => {
      resolveChatCompletions = resolve;
    }) as any
  );

  render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  expect(await screen.findByTestId('Spinner')).toBeInTheDocument();

  resolveChatCompletions({
    id: '1',
    object: 'chat.completion',
    created: 0,
    model: 'base',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    choices: [{ message: { role: 'assistant', content: 'Resolved explanation.' }, finish_reason: 'stop', index: 0 }],
  });

  expect(await screen.findByText(/Resolved explanation\.$/)).toBeInTheDocument();
  expect(screen.queryByText(/grafana ai is analyzing/i)).not.toBeInTheDocument();
});

it('shows the one-liner explanation for a failing check, grounded in the failure logs', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  fetchRecentFailureLogLines.mockResolvedValue([{ text: 'probe_success=0 msg="context deadline exceeded"', severity: 'critical' }]);
  jest.mocked(llm.enabled).mockResolvedValue(true);
  jest.mocked(llm.chatCompletions).mockResolvedValue({
    id: '1',
    object: 'chat.completion',
    created: 0,
    model: 'base',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    choices: [
      { message: { role: 'assistant', content: 'The target is timing out on every probe request.' }, finish_reason: 'stop', index: 0 },
    ],
  } as any);

  render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  expect(await screen.findByText(/The target is timing out on every probe request\.$/)).toBeInTheDocument();

  const [{ messages }] = jest.mocked(llm.chatCompletions).mock.calls[0];
  const userMessage = messages.find((message) => message.role === 'user')?.content ?? '';
  expect(userMessage).toContain('context deadline exceeded');
  expect(userMessage).toContain('CheckHighReachability');
});

it('keeps the supporting evidence hidden until the bar is expanded', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  fetchRecentFailureLogLines.mockResolvedValue([{ text: 'probe_success=0 msg="context deadline exceeded"', severity: 'critical' }]);
  jest.mocked(llm.enabled).mockResolvedValue(true);
  jest.mocked(llm.chatCompletions).mockResolvedValue({
    id: '1',
    object: 'chat.completion',
    created: 0,
    model: 'base',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    choices: [{ message: { role: 'assistant', content: 'Explanation.' }, finish_reason: 'stop', index: 0 }],
  } as any);

  const { user, container } = render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);
  await screen.findByText(/Explanation\.$/);

  expect(screen.queryByText(/context deadline exceeded/)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /show evidence/i }));

  expect(await screen.findByText(/context deadline exceeded/)).toBeInTheDocument();
  expect(container).toHaveTextContent('Reachability: 50% over 3h');
  expect(container).toHaveTextContent('Firing alert: CheckHighReachability');
});
