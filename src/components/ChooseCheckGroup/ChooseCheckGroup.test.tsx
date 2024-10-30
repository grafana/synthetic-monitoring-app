import React from 'react';
import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
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

  expect(screen.queryByRole('link', { name: `API Endpoint` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Multi Step` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Scripted` })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Browser` })).not.toBeInTheDocument();
});

it('shows the scripted card with correct feature flag on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByRole('link', { name: `Scripted` })).toBeInTheDocument();
});

it('shows the browser card with correct feature flag on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.BrowserChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByRole('link', { name: `Browser` })).toBeInTheDocument();
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
  const limitError = await screen.findByText(/You have reached your check limit of /);
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
  const alert = await screen.findByText(/You have reached your monthly execution limit of/);
  expect(alert).toBeInTheDocument();

  const apiEndPointButton = screen.getByRole('link', { name: `API Endpoint` });
  const multiStepButton = screen.getByRole('link', { name: `Multi Step` });
  const scriptedButton = screen.getByRole('link', { name: `Scripted` });
  const browserButton = screen.getByRole('link', { name: `Browser` });

  expect(apiEndPointButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(multiStepButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(scriptedButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(browserButton).toHaveAttribute(`aria-disabled`, `true`);
});
