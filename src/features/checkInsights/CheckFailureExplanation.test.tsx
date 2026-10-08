import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { InlineAssistantOptions, useAssistant, useInlineAssistant, useLimits, useTerms } from '@grafana/assistant';
import { usePluginComponent } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { RecentFailureEvidence } from 'features/checkInsights/fetchRecentFailureLogLines';
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
  fetchRecentFailureLogLines: jest.MockedFunction<() => Promise<RecentFailureEvidence>>;
};

function mockReachability(fraction: number | undefined) {
  useCheckReachabilitySuccessRate.mockReturnValue({
    data: fraction === undefined ? undefined : ({ value: [0, String(fraction)] } as MetricCheckSuccess),
    isLoading: false,
    isFetched: true,
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
    isFetched: true,
  } as any);
}

/** Default: resolves immediately with no explanation, for tests that don't care about the text. */
function mockInlineAssistantAutoResolve() {
  const generate = jest.fn<Promise<void>, [InlineAssistantOptions]>(async (options) => {
    options.onComplete?.('');
  });
  jest.mocked(useInlineAssistant).mockReturnValue({
    generate,
    isGenerating: false,
    content: '',
    error: null,
    cancel: jest.fn(),
    reset: jest.fn(),
  });
  return generate;
}

/**
 * Manual control: the caller resolves via the captured onComplete/onError, mirroring the old
 * `resolveChatCompletions` pattern from when this called `llm.chatCompletions` directly.
 */
function mockInlineAssistantManual() {
  const generate = jest.fn<Promise<void>, [InlineAssistantOptions]>();
  jest.mocked(useInlineAssistant).mockReturnValue({
    generate,
    isGenerating: false,
    content: '',
    error: null,
    cancel: jest.fn(),
    reset: jest.fn(),
  });
  return generate;
}

async function findGenerateOptions(generate: jest.Mock) {
  await waitFor(() => expect(generate).toHaveBeenCalled());
  return generate.mock.calls[0][0] as InlineAssistantOptions;
}

beforeEach(() => {
  fetchRecentFailureLogLines.mockReset().mockResolvedValue({ lines: [], failingProbes: [] });
  // Explicit, stable defaults for every test (rather than relying on the global mocks' own
  // internal defaults) — usePluginComponent's global default already matches (no incident
  // plugin installed), but useAssistant/useInlineAssistant's global mocks create *new* mock
  // functions on every render, which would make it impossible for a test to assert on a call
  // made after a re-render. Pinning them here gives every test the same stable mock functions
  // to assert against. useTerms/useLimits default to "fully clear to use Assistant".
  jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: true,
    isLoading: false,
    openAssistant: jest.fn(),
    closeAssistant: jest.fn(),
    toggleAssistant: jest.fn(),
  });
  jest.mocked(useTerms).mockReturnValue({ accepted: true, termsType: 'termsAndConditions', loading: false, error: null });
  jest.mocked(useLimits).mockReturnValue({
    count: 0,
    limit: 0,
    month: '2026-01',
    isLimitReached: false,
    loading: false,
    error: null,
    refetch: jest.fn(),
  });
  mockInlineAssistantAutoResolve();
});

it('renders nothing, without calling Assistant, for a healthy check', async () => {
  mockReachability(1);
  mockAlertStates([]);
  const generate = mockInlineAssistantAutoResolve();
  renderExplanation(BASIC_HTTP_CHECK);

  await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
  expect(screen.queryByText(/healthy|failing|alert firing/i)).not.toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows a failing status without an AI explanation when the org has not enabled the setting', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  const generate = mockInlineAssistantAutoResolve();

  renderExplanation(BASIC_HTTP_CHECK, { aiCheckExplanationsEnabled: false });

  expect(await screen.findByText('Alert firing')).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows why the explanation is unavailable when Grafana Assistant is not available', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  const generate = mockInlineAssistantAutoResolve();
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: false,
    isLoading: false,
    openAssistant: undefined,
    closeAssistant: undefined,
    toggleAssistant: undefined,
  });

  renderExplanation(BASIC_HTTP_CHECK);

  expect(await screen.findByText('Failing')).toBeInTheDocument();
  expect(await screen.findByText(/grafana assistant is not available\.$/i)).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows why the explanation is unavailable when the terms and conditions are not accepted', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  const generate = mockInlineAssistantAutoResolve();
  jest.mocked(useTerms).mockReturnValue({ accepted: false, termsType: 'termsAndConditions', loading: false, error: null });

  renderExplanation(BASIC_HTTP_CHECK);

  expect(await screen.findByText(/accept grafana assistant's terms and conditions/i)).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows a status-check error, not an accept-terms prompt, when the terms check itself fails', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  const generate = mockInlineAssistantAutoResolve();
  jest.mocked(useTerms).mockReturnValue({
    accepted: false,
    termsType: 'termsAndConditions',
    loading: false,
    error: 'network error',
  });

  renderExplanation(BASIC_HTTP_CHECK);

  expect(await screen.findByText(/couldn't check grafana assistant's status\./i)).toBeInTheDocument();
  expect(screen.queryByText(/accept grafana assistant's terms and conditions/i)).not.toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows why the explanation is unavailable when the usage limit has been reached', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  const generate = mockInlineAssistantAutoResolve();
  jest.mocked(useLimits).mockReturnValue({
    count: 100,
    limit: 100,
    month: '2026-01',
    isLimitReached: true,
    loading: false,
    error: null,
    refetch: jest.fn(),
  });

  renderExplanation(BASIC_HTTP_CHECK);

  expect(await screen.findByText(/grafana assistant's usage limit has been reached\.$/i)).toBeInTheDocument();
  expect(generate).not.toHaveBeenCalled();
});

it('shows a message when the explanation call genuinely fails, not when it just had nothing to say', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  const generate = mockInlineAssistantManual();

  render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  const options = await findGenerateOptions(generate);
  options.onError?.(new Error('boom'));

  expect(await screen.findByText(/couldn't generate an explanation right now\.$/i)).toBeInTheDocument();
});

it('still fetches and shows the log evidence when Grafana Assistant is not available', async () => {
  mockReachability(0.5);
  mockAlertStates([]);
  mockInlineAssistantAutoResolve();
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: false,
    isLoading: false,
    openAssistant: undefined,
    closeAssistant: undefined,
    toggleAssistant: undefined,
  });
  fetchRecentFailureLogLines.mockResolvedValue({
    lines: [{ text: 'error: x509: certificate signed by unknown authority', severity: 'critical' }],
    failingProbes: [],
  });

  const { user } = renderExplanation(BASIC_HTTP_CHECK);
  await screen.findByText('Failing');

  await waitFor(() => expect(fetchRecentFailureLogLines).toHaveBeenCalled());
  await user.click(screen.getByRole('button', { name: 'Evidence' }));

  expect(await screen.findByText(/x509: certificate signed by unknown authority/)).toBeInTheDocument();
});

it('shows the analyzing state while the request is in flight, then the resolved explanation', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  const generate = mockInlineAssistantManual();

  render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  expect(await screen.findByTestId('explanation-skeleton')).toBeInTheDocument();

  const options = await findGenerateOptions(generate);
  options.onComplete?.('Resolved explanation.');

  expect(await screen.findByText(/Resolved explanation\.$/)).toBeInTheDocument();
  expect(screen.queryByText(/grafana ai is analyzing/i)).not.toBeInTheDocument();
});

it('waits for alert state to finish loading too, not just logs, before generating an explanation', async () => {
  // Alerts haven't resolved yet even though reachability already shows failing — isCheckFailing
  // can flip true from whichever metric arrives first.
  mockReachability(0.5);
  useChecksAlertStates.mockReturnValue({ data: {}, isLoading: true, isFetched: false } as any);
  const generate = mockInlineAssistantAutoResolve();

  const { rerender } = render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);
  await screen.findByText('Failing');

  await waitFor(() => expect(generate).not.toHaveBeenCalled());

  mockAlertStates(['CheckHighReachability']);
  rerender(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  await waitFor(() => expect(generate).toHaveBeenCalled());
});

it('keeps showing an already-cached explanation instead of a skeleton while the Assistant gate reloads', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  const generate = mockInlineAssistantManual();

  const { rerender } = render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);
  const options = await findGenerateOptions(generate);
  options.onComplete?.('Cached explanation.');
  await screen.findByText(/Cached explanation\.$/);

  // useAssistant/useTerms/useLimits reset to "loading" on every real mount, even though the
  // explanation itself is already cached from the fetch above (same check, same evidence).
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: true,
    isLoading: true,
    openAssistant: undefined,
    closeAssistant: undefined,
    toggleAssistant: undefined,
  });
  rerender(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  expect(screen.getByText(/Cached explanation\.$/)).toBeInTheDocument();
  expect(screen.queryByTestId('explanation-skeleton')).not.toBeInTheDocument();
});

it('shows the one-liner explanation for a failing check, grounded in the failure logs', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  fetchRecentFailureLogLines.mockResolvedValue({
    lines: [{ text: 'probe_success=0 msg="context deadline exceeded"', severity: 'critical' }],
    failingProbes: ['Paris'],
  });
  const generate = mockInlineAssistantManual();

  render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

  const options = await findGenerateOptions(generate);
  expect(options.prompt).toContain('context deadline exceeded');
  expect(options.prompt).toContain('CheckHighReachability');
  expect(options.prompt).toContain('Paris');

  options.onComplete?.('The target is timing out on every probe request.');

  expect(await screen.findByText(/The target is timing out on every probe request\.$/)).toBeInTheDocument();
});

it('keeps the supporting evidence hidden until the bar is expanded', async () => {
  mockReachability(0.5);
  mockAlertStates(['CheckHighReachability']);
  fetchRecentFailureLogLines.mockResolvedValue({
    lines: [{ text: 'probe_success=0 msg="context deadline exceeded"', severity: 'critical' }],
    failingProbes: ['Paris'],
  });
  const generate = mockInlineAssistantManual();

  const { user, container } = render(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);
  const options = await findGenerateOptions(generate);
  options.onComplete?.('Explanation.');

  await screen.findByText(/Explanation\.$/);

  expect(screen.queryByText(/context deadline exceeded/)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Evidence' }));

  expect(await screen.findByText(/context deadline exceeded/)).toBeInTheDocument();
  expect(container).toHaveTextContent('Failing probe: Paris');
  expect(container).toHaveTextContent('Reachability: 50% over 3h');
  expect(container).toHaveTextContent('Firing alert: CheckHighReachability');
});

describe('Actions menu', () => {
  function FakeDeclareIncidentForm({ defaultTitle }: { defaultTitle?: string }) {
    return <div data-testid="fake-incident-form">{defaultTitle}</div>;
  }

  it('lists start investigation and create incident when both integrations are available', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await screen.findByText('Failing');

    await user.click(await screen.findByRole('button', { name: /^actions$/i }));

    expect(screen.getByRole('menuitem', { name: /start investigation/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /create incident/i })).toBeInTheDocument();
  });

  it('shows the button when at least one integration is available, and hides it entirely when none are', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: false,
      isLoading: false,
      openAssistant: undefined,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });

    // Only the incident integration is available at first (assistant unavailable).
    const { rerender } = renderExplanation(BASIC_HTTP_CHECK);
    expect(await screen.findByRole('button', { name: /^actions$/i })).toBeInTheDocument();

    jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
    rerender(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

    await waitFor(() => expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument());
  });

  it('keeps the Actions button as a skeleton while the incident plugin is still loading, rather than showing an undercounted button first', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    mockInlineAssistantAutoResolve();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: false,
      isLoading: false,
      openAssistant: undefined,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });
    jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: true });

    const { rerender } = renderExplanation(BASIC_HTTP_CHECK);
    await screen.findByText('Failing');

    // Assistant is unavailable and the incident plugin hasn't resolved yet — no button at all
    // yet, resolved or otherwise, since we don't know if it'll end up with an action to offer.
    await waitFor(() => expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument());

    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });
    rerender(<CheckFailureExplanation check={BASIC_HTTP_CHECK} />);

    expect(await screen.findByRole('button', { name: /^actions$/i })).toBeInTheDocument();
  });

  it('opens the assistant in investigation mode with auto-send when "Start investigation" is clicked', async () => {
    mockReachability(0.5);
    mockAlertStates(['CheckHighReachability']);
    const openAssistant = jest.fn();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await user.click(await screen.findByRole('button', { name: /^actions$/i }));
    await user.click(screen.getByRole('menuitem', { name: /start investigation/i }));

    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'investigation',
        autoSend: true,
        prompt: expect.stringContaining(BASIC_HTTP_CHECK.job),
      })
    );
  });

  it('opens the incident form when "Create incident" is clicked', async () => {
    mockReachability(0.5);
    mockAlertStates([]);
    jest.mocked(usePluginComponent).mockReturnValue({ component: FakeDeclareIncidentForm, isLoading: false });

    const { user } = renderExplanation(BASIC_HTTP_CHECK);
    await user.click(await screen.findByRole('button', { name: /^actions$/i }));
    await user.click(screen.getByRole('menuitem', { name: /create incident/i }));

    expect(await screen.findByTestId('fake-incident-form')).toHaveTextContent(BASIC_HTTP_CHECK.job);
  });

  it('shows a loading skeleton instead of the Actions button while the explanation is in flight', async () => {
    mockReachability(0.5);
    mockAlertStates(['CheckHighReachability']);
    const generate = mockInlineAssistantManual();

    renderExplanation(BASIC_HTTP_CHECK);
    await screen.findByTestId('explanation-skeleton');

    expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument();

    const options = await findGenerateOptions(generate);
    options.onComplete?.('Explanation.');

    expect(await screen.findByRole('button', { name: /^actions$/i })).toBeInTheDocument();
  });
});
