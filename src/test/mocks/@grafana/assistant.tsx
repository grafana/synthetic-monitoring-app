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

  return {
    __esModule: true,
    providePageContext,
    provideQuestions,
    useProvidePageContext,
    useAssistant,
    isAssistantAvailable,
    createAssistantContextItem,
  };
});
