/**
 * Global mock for the @grafana/assistant SDK.
 *
 * The real SDK relies on global registries and event emitters that aren't
 * exercised by our integration. Tests treat the SDK as a thin observable
 * boundary: we assert that `providePageContext` is called with the right
 * URL patterns when `useAssistant` reports the Assistant as available.
 *
 * Per-test overrides:
 *   import { useAssistant, providePageContext } from '@grafana/assistant';
 *   jest.mocked(useAssistant).mockReturnValueOnce({ isAvailable: false, ... });
 *
 * Also stubs useTerms/useLimits/useInlineAssistant (used by the check-failure-explanation
 * feature's non-interactive completion path), defaulting to "fully clear to use Assistant".
 */
jest.mock('@grafana/assistant', () => {
  const makeRegistration = () => {
    const setter = jest.fn() as jest.Mock & { unregister: jest.Mock };
    setter.unregister = jest.fn();
    return setter;
  };

  const providePageContext = jest.fn(() => makeRegistration());
  const provideQuestions = jest.fn(() => makeRegistration());
  const useProvidePageContext = jest.fn(() => jest.fn());

  const useAssistant = jest.fn(() => ({
    isAvailable: true,
    isLoading: false,
    openAssistant: jest.fn(),
    closeAssistant: jest.fn(),
    toggleAssistant: jest.fn(),
  }));

  const isAssistantAvailable = jest.fn(() => ({
    subscribe: jest.fn(),
  }));

  const createAssistantContextItem = jest.fn((type, params) => ({ type, ...params }));

  // Defaults represent an org that's fully clear to use Assistant (terms accepted, under its
  // usage limit) — tests for the check-failure-explanation feature override these per case to
  // exercise the blocked states (see CheckFailureExplanation.test.tsx / AiCheckExplanationsSetting.test.tsx).
  const useTerms = jest.fn(() => ({
    accepted: true,
    termsType: 'termsAndConditions' as const,
    loading: false,
    error: null,
  }));
  const checkTerms = jest.fn(() => Promise.resolve(true));

  const useLimits = jest.fn(() => ({
    count: 0,
    limit: 0,
    month: '2026-01',
    isLimitReached: false,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }));
  const checkLimits = jest.fn(() => Promise.resolve({ count: 0, limit: 0, month: '2026-01', isLimitReached: false }));

  const useInlineAssistant = jest.fn(() => ({
    generate: jest.fn(),
    isGenerating: false,
    content: '',
    error: null,
    cancel: jest.fn(),
    reset: jest.fn(),
  }));

  return {
    __esModule: true,
    providePageContext,
    provideQuestions,
    useProvidePageContext,
    useAssistant,
    isAssistantAvailable,
    TERMS_AND_CONDITIONS_REFRESH_EVENT: 'grafana-assistant-terms-and-conditions-refresh',
    createAssistantContextItem,
    useTerms,
    checkTerms,
    useLimits,
    checkLimits,
    useInlineAssistant,
  };
});
