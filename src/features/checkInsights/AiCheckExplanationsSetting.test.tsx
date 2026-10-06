import React from 'react';
import { useAssistant, useLimits, useTerms } from '@grafana/assistant';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SM_META } from 'test/fixtures/meta';
import { render } from 'test/render';
import { server } from 'test/server';

import { AiCheckExplanationsSetting } from './AiCheckExplanationsSetting';

function mockAssistantReady({
  isAssistantAvailable = true,
  termsAccepted = true,
  termsError = null as string | null,
  isLimitReached = false,
  limitsError = null as string | null,
  openAssistant = jest.fn(),
} = {}) {
  jest.mocked(useAssistant).mockReturnValue({
    isAvailable: isAssistantAvailable,
    isLoading: false,
    openAssistant: isAssistantAvailable ? openAssistant : undefined,
    closeAssistant: jest.fn(),
    toggleAssistant: jest.fn(),
  });
  jest.mocked(useTerms).mockReturnValue({
    accepted: termsAccepted,
    termsType: 'termsAndConditions',
    loading: false,
    error: termsError,
  });
  jest.mocked(useLimits).mockReturnValue({
    count: isLimitReached ? 100 : 0,
    limit: 100,
    month: '2026-01',
    isLimitReached,
    loading: false,
    error: limitsError,
    refetch: jest.fn(),
  });
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
  mockAssistantReady();
});

it('defaults to on when the org has never set the value', async () => {
  renderSetting(undefined);

  expect(await screen.findByRole('switch')).toBeChecked();
});

it('stays togglable (to turn off), with an explanation, when Grafana Assistant is not available', async () => {
  mockAssistantReady({ isAssistantAvailable: false });
  renderSetting(undefined);

  // Defaults to on; turning it off has to stay possible even though Assistant isn't available,
  // or an org in this state could never opt out — see "cannot be turned on" below for the
  // complementary half of this behavior.
  expect(await screen.findByRole('switch')).not.toBeDisabled();
  expect(screen.getByText(/requires grafana assistant to be enabled/i)).toBeInTheDocument();
});

it('stays togglable (to turn off), with an explanation, when the usage limit has been reached', async () => {
  mockAssistantReady({ isLimitReached: true });
  renderSetting(undefined);

  expect(await screen.findByRole('switch')).not.toBeDisabled();
  expect(screen.getByText(/usage limit has been reached/i)).toBeInTheDocument();
});

it('stays togglable (to turn off), with a status-check error, when the terms check fails, not an accept-terms prompt', async () => {
  mockAssistantReady({ termsAccepted: false, termsError: 'network error' });
  renderSetting(undefined);

  expect(await screen.findByRole('switch')).not.toBeDisabled();
  expect(screen.getByText(/couldn't check grafana assistant's status/i)).toBeInTheDocument();
  expect(screen.queryByText(/accept the grafana assistant terms and conditions/i)).not.toBeInTheDocument();
});

it('stays togglable (to turn off), and offers to open Assistant, when the terms and conditions are not accepted', async () => {
  const openAssistant = jest.fn();
  mockAssistantReady({ termsAccepted: false, openAssistant });
  const { user } = renderSetting(undefined);

  expect(await screen.findByRole('switch')).not.toBeDisabled();
  expect(screen.getByText(/accept the grafana assistant terms and conditions/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /open assistant/i }));
  expect(openAssistant).toHaveBeenCalled();
});

it('cannot be turned on while Grafana Assistant is not available', async () => {
  mockAssistantReady({ isAssistantAvailable: false });
  renderSetting(false);

  expect(await screen.findByRole('switch')).not.toBeChecked();
  expect(await screen.findByRole('switch')).toBeDisabled();
});

it('saves immediately, without confirmation, when turning the setting off', async () => {
  const getSavedBody = mockSettingsSave();
  const { user } = renderSetting(true);

  await user.click(await screen.findByRole('switch'));

  expect(screen.queryByText(/enable ai check failure explanations\?/i)).not.toBeInTheDocument();
  await waitFor(() => expect(getSavedBody()).toBeDefined());
  expect(getSavedBody().jsonData.aiCheckExplanationsEnabled).toBe(false);
});

it('asks for confirmation before turning the setting on, and saves only on confirm', async () => {
  const getSavedBody = mockSettingsSave();
  const { user } = renderSetting(false);

  await user.click(await screen.findByRole('switch'));

  expect(screen.getByText(/enable ai check failure explanations\?/i)).toBeInTheDocument();
  expect(getSavedBody()).toBeUndefined();

  await user.click(screen.getByRole('button', { name: 'Enable' }));

  await waitFor(() => expect(getSavedBody()).toBeDefined());
  expect(getSavedBody().jsonData.aiCheckExplanationsEnabled).toBe(true);
});
