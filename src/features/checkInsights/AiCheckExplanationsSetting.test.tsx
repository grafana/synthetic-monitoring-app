import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SM_META } from 'test/fixtures/meta';
import { render } from 'test/render';
import { server } from 'test/server';

import { AiCheckExplanationsSetting } from './AiCheckExplanationsSetting';

jest.mock('features/checkInsights/useLlmEnabled', () => ({
  useLlmEnabled: jest.fn(),
}));

const { useLlmEnabled } = jest.requireMock('features/checkInsights/useLlmEnabled') as {
  useLlmEnabled: jest.MockedFunction<() => Partial<UseQueryResult<boolean>>>;
};

function mockLlmEnabled(enabled: boolean) {
  useLlmEnabled.mockReturnValue({ data: enabled, isLoading: false } as any);
}

/** Captures the body of the plugin-settings save request, if any is made. */
function mockSettingsSave() {
  let savedBody: any;
  server.use(
    http.post(`/api/plugins/${SM_META.id}/settings`, async ({ request }) => {
      savedBody = await request.json();
      return HttpResponse.json({});
    })
  );
  return () => savedBody;
}

function renderSetting(aiCheckExplanationsEnabled?: boolean) {
  return render(<AiCheckExplanationsSetting />, {
    meta: { jsonData: { ...SM_META.jsonData, aiCheckExplanationsEnabled } },
  });
}

beforeEach(() => {
  // window.location.reload() after a successful save isn't implemented by jsdom; it logs
  // rather than throws, so just keep that specific noise out of the test output.
  const originalError = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const message = typeof args[0] === 'string' ? args[0] : (args[0] as Error)?.message;
    if (!message?.includes('Not implemented: navigation')) {
      originalError(...args);
    }
  });
});

it('defaults to on when the org has never set the value', async () => {
  mockLlmEnabled(true);
  renderSetting(undefined);

  expect(await screen.findByRole('switch')).toBeChecked();
});

it('is disabled, with an explanation, when the Grafana LLM app is not configured', async () => {
  mockLlmEnabled(false);
  renderSetting(undefined);

  expect(await screen.findByRole('switch')).toBeDisabled();
  expect(screen.getByText(/requires the grafana llm app/i)).toBeInTheDocument();
});

it('saves immediately, without confirmation, when turning the setting off', async () => {
  mockLlmEnabled(true);
  const getSavedBody = mockSettingsSave();
  const { user } = renderSetting(true);

  await user.click(await screen.findByRole('switch'));

  expect(screen.queryByText(/enable ai check failure explanations\?/i)).not.toBeInTheDocument();
  await waitFor(() => expect(getSavedBody()).toBeDefined());
  expect(getSavedBody().jsonData.aiCheckExplanationsEnabled).toBe(false);
});

it('asks for confirmation before turning the setting on, and saves only on confirm', async () => {
  mockLlmEnabled(true);
  const getSavedBody = mockSettingsSave();
  const { user } = renderSetting(false);

  await user.click(await screen.findByRole('switch'));

  expect(screen.getByText(/enable ai check failure explanations\?/i)).toBeInTheDocument();
  expect(getSavedBody()).toBeUndefined();

  await user.click(screen.getByRole('button', { name: 'Enable' }));

  await waitFor(() => expect(getSavedBody()).toBeDefined());
  expect(getSavedBody().jsonData.aiCheckExplanationsEnabled).toBe(true);
});
