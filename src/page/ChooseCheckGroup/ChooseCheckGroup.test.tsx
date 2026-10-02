import React from 'react';
import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsHGFreeUserOverLimit, runTestAsViewer } from 'test/utils';

import { FeatureName } from 'types';

import { ChooseCheckGroup } from './ChooseCheckGroup';

jest.mock('features/tracking/checkTemplateEvents');

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

it('shows check type options correctly', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: false });
  await renderChooseCheckGroup();

  expect(screen.queryByRole('link', { name: `API Endpoint` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Multi Step` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Scripted` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Browser` })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Detect broken links' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Check SSL certificate' })).not.toBeInTheDocument();
});

it('opens the broken links drawer from its card and no longer offers SSL', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  const { user } = await renderChooseCheckGroup();
  await user.click(await screen.findByRole('button', { name: 'Detect broken links' }));
  expect(await screen.findByRole('textbox', { name: 'Page URL' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create check' })).toBeInTheDocument();
  expect(screen.queryByText('Check SSL certificate')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('textbox', { name: 'Page URL' })).not.toBeInTheDocument();
});

it('disables the template when the check limit is reached', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  await renderChooseCheckGroup({ checkLimit: 1 });
  await screen.findByText(/You have reached your check limit of /);
  expect(screen.getByRole('group', { name: 'Detect broken links' })).toHaveAttribute('aria-disabled', 'true');
});

it('disables the template for viewers', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  runTestAsViewer();
  await renderChooseCheckGroup();
  expect(await screen.findByRole('group', { name: 'Detect broken links' })).toHaveAttribute('aria-disabled', 'true');
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
