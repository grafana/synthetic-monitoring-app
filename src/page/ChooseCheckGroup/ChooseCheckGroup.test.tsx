import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsHGFreeUserOverLimit, runTestAsViewer } from 'test/utils';

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
  await screen.findByText('Create a new check');

  return res;
}

it('shows check type options correctly', async () => {
  await renderChooseCheckGroup();

  expect(screen.getByRole('heading', { name: 'API Endpoint' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Multi Step' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Scripted' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Browser' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^api endpoint$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^multi step$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^scripted$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^browser$/i })).toBeInTheDocument();
});

it('shows a start from a template section', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  await renderChooseCheckGroup();

  expect(screen.getByText('Start from a template')).toBeInTheDocument();
  expect(screen.getByText('Detect broken links')).toBeInTheDocument();
  expect(screen.getByText('Check a page for links that no longer work.')).toBeInTheDocument();
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

  const tileButtons = [
    screen.getByRole('link', { name: /^api endpoint$/i }),
    screen.getByRole('link', { name: /^multi step$/i }),
    screen.getByRole('link', { name: /^scripted$/i }),
    screen.getByRole('link', { name: /^browser$/i }),
  ];

  tileButtons.forEach((button) => {
    expect(button).toHaveAttribute(`aria-disabled`, `true`);
  });
});

it('hides templates when the feature flag is disabled', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: false });
  await renderChooseCheckGroup();
  expect(screen.queryByText('Start from a template')).not.toBeInTheDocument();
});

it('opens the template drawer from the redesigned card', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  const { user } = await renderChooseCheckGroup();
  const card = await screen.findByRole('button', { name: 'Detect broken links' });
  await waitFor(() => expect(card).toBeEnabled());
  await user.click(card);
  expect(await screen.findByRole('textbox', { name: 'Page URL' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Check name' })).toHaveValue('Detect broken links');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('textbox', { name: 'Page URL' })).not.toBeInTheDocument();
});

it('disables templates when the check limit is reached', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  await renderChooseCheckGroup({ checkLimit: 1 });
  await screen.findByText(/You have reached your check limit of /);
  expect(screen.getByRole('button', { name: 'Detect broken links' })).toBeDisabled();
});

it('disables templates for viewers', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  runTestAsViewer();
  await renderChooseCheckGroup();
  expect(await screen.findByRole('button', { name: 'Detect broken links' })).toBeDisabled();
});
