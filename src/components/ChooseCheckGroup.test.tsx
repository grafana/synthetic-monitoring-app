import React from 'react';
import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

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
it('shows check type options with scripted feature off', async () => {
  await renderChooseCheckGroup();

  expect(screen.getByText('API Endpoint')).toBeInTheDocument();
  expect(screen.getByText('Multi Step')).toBeInTheDocument();
  expect(screen.queryByText('Scripted')).not.toBeInTheDocument();
});

it('shows check type options with scripted feature on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByText('Scripted')).toBeInTheDocument();
});

it('shows error alert when check limit is reached', async () => {
  await renderChooseCheckGroup({ checkLimit: 1 });
  const limitError = await screen.findByText('Check limit reached');
  expect(limitError).toBeInTheDocument();
});

it('shows error alert when scripted check limit is reached', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderChooseCheckGroup({ checkLimit: 10, scriptedLimit: 0 });
  const limitError = await screen.findByText('Scripted check limit reached');
  expect(limitError).toBeInTheDocument();
});

it('shows total check limit over scripted check limit error if both are reached', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderChooseCheckGroup({ checkLimit: 1, scriptedLimit: 0 });
  const limitError = await screen.findByText('Check limit reached');
  expect(limitError).toBeInTheDocument();
  expect(screen.queryByText('Scripted check limit reached')).not.toBeInTheDocument();
});
