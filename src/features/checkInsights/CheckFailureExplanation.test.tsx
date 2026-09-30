import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { useAssistant } from '@grafana/assistant';
import { llm } from '@grafana/llm';
import { usePluginComponent } from '@grafana/runtime';
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
  // Explicit, stable defaults for every test (rather than relying on the global mocks' own
  // internal defaults) — usePluginComponent's global default already matches (no incident
  // plugin installed), but useAssistant's global mock creates a *new* openAssistant jest.fn on
  // every render, which would make it impossible for a test to assert on a call made after a
  // re-render. Pinning it here gives every test the same stable mock function to assert against.
  jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: true,
    isLoading: false,
    openAssistant: jest.fn(),
    closeAssistant: jest.fn(),
    toggleAssistant: jest.fn(),
  });
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

it('still fetches and shows the log evidence when the Grafana LLM app is not configured', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  jest.mocked(llm.enabled).mockResolvedValue(false);
  fetchRecentFailureLogLines.mockResolvedValue([
    { text: 'error: x509: certificate signed by unknown authority', severity: 'critical' },
  ]);

  const { user } = renderExplanation(BASIC_HTTP_CHECK);
  await screen.findByText('Failing');

  await waitFor(() => expect(fetchRecentFailureLogLines).toHaveBeenCalled());
  await user.click(screen.getByRole('button', { name: /show evidence/i }));

  expect(await screen.findByText(/x509: certificate signed by unknown authority/)).toBeInTheDocument();
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

describe('Actions menu', () => {
  function FakeDeclareIncidentForm({ defaultTitle }: { defaultTitle?: string }) {
    return <div data-testid="fake-incident-form">{defaultTitle}</div>;
  }

  it('lists ask assistant, start investigation, and create incident when both integrations are available', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(llm.enabled).mockResolvedValue(false);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await screen.findByText('Failing');

    await user.click(await screen.findByRole('button', { name: /actions \(3\)/i }));

    expect(screen.getByRole('menuitem', { name: /ask assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /start investigation/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /create incident/i })).toBeInTheDocument();
  });

  it('counts only the available integrations, and hides the button entirely when none are', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(llm.enabled).mockResolvedValue(false);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: false,
      isLoading: false,
      openAssistant: undefined,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });

    const { rerender } = renderExplanation(BASIC_HTTP_CHECK);
    expect(await screen.findByRole('button', { name: /actions \(1\)/i })).toBeInTheDocument();

    jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
    rerender(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

    await waitFor(() => expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument());
  });

  it('opens the assistant in assistant mode without auto-sending when "Ask assistant" is clicked', async () => {
    mockReachability(0.5);
    mockAlertStates(['CheckHighReachability']);
    jest.mocked(llm.enabled).mockResolvedValue(false);
    const openAssistant = jest.fn();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await user.click(await screen.findByRole('button', { name: /actions \(2\)/i }));
    await user.click(screen.getByRole('menuitem', { name: /ask assistant/i }));

    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'assistant', autoSend: false, prompt: expect.stringContaining(BASIC_HTTP_CHECK.job) })
    );
  });

  it('opens the assistant in investigation mode with auto-send when "Start investigation" is clicked', async () => {
    mockReachability(0.5);
    mockAlertStates(['CheckHighReachability']);
    jest.mocked(llm.enabled).mockResolvedValue(false);
    const openAssistant = jest.fn();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await user.click(await screen.findByRole('button', { name: /actions \(2\)/i }));
    await user.click(screen.getByRole('menuitem', { name: /start investigation/i }));

    expect(openAssistant).toHaveBeenCalledWith(expect.objectContaining({ mode: 'investigation', autoSend: true }));
  });

  it('opens the incident form when "Create incident" is clicked', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(llm.enabled).mockResolvedValue(false);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await user.click(await screen.findByRole('button', { name: /actions \(3\)/i }));
    await user.click(screen.getByRole('menuitem', { name: /create incident/i }));

    expect(await screen.findByTestId('fake-incident-form')).toHaveTextContent(BASIC_HTTP_CHECK.job);
  });

  it('shows a loading skeleton instead of the Actions button while the explanation is in flight', async () => {
    mockReachability(0.5);
    mockAlertStates(['CheckHighReachability']);
    jest.mocked(llm.enabled).mockResolvedValue(true);

    let resolveChatCompletions: (value: any) => void = () => {};
    jest.mocked(llm.chatCompletions).mockReturnValue(
      new Promise((resolve) => {
        resolveChatCompletions = resolve;
      }) as any
    );

    renderExplanation(BASIC_HTTP_CHECK);
    await screen.findByTestId('Spinner');

    expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument();

    resolveChatCompletions({
      id: '1',
      object: 'chat.completion',
      created: 0,
      model: 'base',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      choices: [{ message: { role: 'assistant', content: 'Explanation.' }, finish_reason: 'stop', index: 0 }],
    });

    expect(await screen.findByRole('button', { name: /actions \(2\)/i })).toBeInTheDocument();
  });
});
