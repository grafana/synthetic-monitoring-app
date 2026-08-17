import { createAssistantContextItem } from '@grafana/assistant';
import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK, COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';

import { useDemAssistantContext } from './useDemAssistantContext';

const mockCreateAssistantContextItem = createAssistantContextItem as jest.Mock;

const FRONTEND_OBSERVABILITY_SETUP_URL = '/a/grafana-kowalski-app/apps/new';

interface StructuredParams {
  title: string;
  data: {
    setup: { entryPoint: string };
    userBrowserChecks: Array<{ job: string; target: string }>;
    currentlyViewedCheck?: { job: string; target: string };
  };
}

function structuredParams(callIndex = 0): StructuredParams {
  return mockCreateAssistantContextItem.mock.calls[callIndex][1];
}

describe('useDemAssistantContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides no context when there are no checks', () => {
    renderHook(() => useDemAssistantContext([]));

    expect(mockCreateAssistantContextItem).not.toHaveBeenCalled();
  });

  it('provides no context when the user has no browser checks', () => {
    renderHook(() => useDemAssistantContext([BASIC_HTTP_CHECK]));

    expect(mockCreateAssistantContextItem).not.toHaveBeenCalled();
  });

  it('provides Frontend Observability context with only the browser checks and the setup URL', () => {
    renderHook(() => useDemAssistantContext([BASIC_HTTP_CHECK, COMPLEX_BROWSER_CHECK]));

    expect(mockCreateAssistantContextItem).toHaveBeenCalledTimes(1);
    expect(mockCreateAssistantContextItem.mock.calls[0][0]).toBe('structured');

    const params = structuredParams();
    expect(params.data.setup.entryPoint).toBe(FRONTEND_OBSERVABILITY_SETUP_URL);
    expect(params.data.userBrowserChecks).toEqual([
      { job: COMPLEX_BROWSER_CHECK.job, target: COMPLEX_BROWSER_CHECK.target },
    ]);
    expect(params.data.currentlyViewedCheck).toBeUndefined();
  });

  it('marks the currently viewed check when a browser check is focused', () => {
    renderHook(() => useDemAssistantContext([COMPLEX_BROWSER_CHECK], { focusedCheck: COMPLEX_BROWSER_CHECK }));

    expect(structuredParams().data.currentlyViewedCheck).toEqual({
      job: COMPLEX_BROWSER_CHECK.job,
      target: COMPLEX_BROWSER_CHECK.target,
    });
  });

  it('ignores a focused check that is not a browser check', () => {
    renderHook(() => useDemAssistantContext([COMPLEX_BROWSER_CHECK], { focusedCheck: BASIC_HTTP_CHECK }));

    expect(structuredParams().data.currentlyViewedCheck).toBeUndefined();
  });
});
