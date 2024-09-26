import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsHGFreeUserOverLimit } from 'test/utils';

import { FeatureName } from 'types';

import { ChooseCheckGroup } from './ChooseCheckGroup';

async function renderChooseCheckGroup({ checkLimit = 10, scriptedLimit = 10 } = {}) {
  server.use(
    apiRoute('getTenantLimits', {
      result: () => ({
        json: {
          MaxChecks: checkLimit,
          MaxScriptedChecks: scriptedLimit,
          MaxMetricLabels: 16,
          MaxLogLabels: 13,
          maxAllowedMetricLabels: 10,
          maxAllowedLogLabels: 5,
        },
      }),
    })
  );
  const res = render(<ChooseCheckGroup />);
  await screen.findByText('Choose a check type');

  return res;
}

it('shows check type options correctly with feature flags off', async () => {
  await renderChooseCheckGroup();

  expect(screen.getByText('API Endpoint')).toBeInTheDocument();
  expect(screen.getByText('Multi Step')).toBeInTheDocument();
  expect(screen.queryByText('Scripted')).not.toBeInTheDocument();
  expect(screen.queryByText('Browser')).not.toBeInTheDocument();
});

it('shows the scripted card with correct feature flag on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByText('Scripted')).toBeInTheDocument();
});

it('shows the browser card with correct feature flag on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.BrowserChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByText('Browser')).toBeInTheDocument();
});

it(`doesn't show gRPC option by default`, async () => {
  await renderChooseCheckGroup();
  expect(screen.queryByText('gRPC')).not.toBeInTheDocument();
});

it('shows gRPC option when feature is enabled', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.GRPCChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByText('gRPC')).toBeInTheDocument();
});

it('shows error alert when check limit is reached', async () => {
  await renderChooseCheckGroup({ checkLimit: 1 });
  const limitError = await screen.findByText(/You have reached the limit of checks you can create./);
  expect(limitError).toBeInTheDocument();
});

it(`shows an error alert when user is HG Free user with over 100k execution limit`, async () => {
  runTestAsHGFreeUserOverLimit();

  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
    [FeatureName.BrowserChecks]: true,
  });

  await renderChooseCheckGroup();
  const alert = await screen.findByText(/You have reached the limit of the monthly executions you can create./);
  expect(alert).toBeInTheDocument();

  const apiEndPointButton = screen.getByRole(`link`, { name: `API Endpoint check` });
  const multiStepButton = screen.getByRole(`link`, { name: `Multi Step check` });
  const scriptedButton = screen.getByRole(`link`, { name: `Scripted check` });
  const browserButton = screen.getByRole(`link`, { name: `Browser check` });

  expect(apiEndPointButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(multiStepButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(scriptedButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(browserButton).toHaveAttribute(`aria-disabled`, `true`);
});

it(`does NOT disable checks if it doesn't get a response from gcom instance api`, async () => {
  server.use(
    apiRoute(`getInstance`, {
      result: () => {
        return {
          json: {},
          status: 401,
        };
      },
    })
  );

  await renderChooseCheckGroup();
  const button = screen.getByRole('link', { name: /API Endpoint check/i });
  const spinner = button.querySelector(`[data-testid="spinner"]`);
  await waitFor(() => expect(spinner).not.toBeInTheDocument());
  expect(screen.getByRole('link', { name: /API Endpoint check/i })).toHaveAttribute('aria-disabled', 'false');
});

it(`does NOT disable checks if it doesn't get a response from gcom org api`, async () => {
  server.use(
    apiRoute(`getOrg`, {
      result: () => {
        return {
          json: {},
          status: 401,
        };
      },
    })
  );

  await renderChooseCheckGroup();
  const button = screen.getByRole('link', { name: /API Endpoint check/i });
  const spinner = button.querySelector(`[data-testid="spinner"]`);
  await waitFor(() => expect(spinner).not.toBeInTheDocument());
  expect(screen.getByRole('link', { name: /API Endpoint check/i })).toHaveAttribute('aria-disabled', 'false');
});

// worried this might be flakey so feel free to delete in the future
it(`disables checks whilst waiting for gcom response`, async () => {
  await renderChooseCheckGroup();
  const apiEndPointButton = screen.getByRole(`link`, { name: `API Endpoint check` });

  expect(apiEndPointButton).toHaveAttribute(`aria-disabled`, `true`);
});
