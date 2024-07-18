import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { FeatureName } from 'types';

import { OverLimitAlert } from './OverLimitAlert';

async function renderOverLimitAlert({ checkLimit = 500, scriptedLimit = 50 } = {}) {
  let loaded = false;

  server.use(
    apiRoute('getTenantLimits', {
      result: () => {
        loaded = true;
        return {
          json: {
            MaxChecks: checkLimit,
            MaxScriptedChecks: scriptedLimit,
            MaxMetricLabels: 16,
            MaxLogLabels: 13,
            maxAllowedMetricLabels: 10,
            maxAllowedLogLabels: 5,
          },
        };
      },
    })
  );
  const res = render(<OverLimitAlert />);
  await waitFor(() => expect(loaded).toBe(true));

  return res;
}
it('shows check type options with scripted feature off', async () => {
  await renderOverLimitAlert();
  expect(screen.queryByText('Check limit reached')).not.toBeInTheDocument();
});

it('shows error alert when check limit is reached', async () => {
  await renderOverLimitAlert({ checkLimit: 0 });
  const limitError = await screen.findByText(/You have reached the limit of checks you can create./);
  expect(limitError).toBeInTheDocument();
});

it('shows error alert when scripted check limit is reached', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderOverLimitAlert({ scriptedLimit: 0 });
  const limitError = await screen.findByText(
    /You have reached the limit of scripted and multiHTTP checks you can create./
  );
  expect(limitError).toBeInTheDocument();
});

it('shows total check limit over scripted check limit error if both are reached', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  await renderOverLimitAlert({ checkLimit: 1, scriptedLimit: 0 });
  const limitError = await screen.findByText(/You have reached the limit of checks you can create./);
  expect(limitError).toBeInTheDocument();
  expect(
    screen.queryByText(/You have reached the limit of scripted and multiHTTP checks you can create./)
  ).not.toBeInTheDocument();
});
