import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { OverLimitAlert } from './OverLimitAlert';

async function renderOverLimitAlert({ browserLimit = 50, checkLimit = 500, scriptedLimit = 50 } = {}) {
  let loaded = false;

  server.use(
    apiRoute('getTenantLimits', {
      result: () => {
        loaded = true;
        return {
          json: {
            MaxBrowserChecks: browserLimit,
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
  const limitError = await screen.findByText(/You have reached your check limit of /);
  expect(limitError).toBeInTheDocument();
});

it('shows error alert when scripted check limit is reached', async () => {
  await renderOverLimitAlert({ scriptedLimit: 0 });
  const limitError = await screen.findByText(/You have reached your Scripted and Multi Step check limit of/);
  expect(limitError).toBeInTheDocument();
});

it('shows error alert when browser check limit is reached', async () => {
  await renderOverLimitAlert({ browserLimit: 0 });
  const limitError = await screen.findByText(/You have reached your Browser check limit of/);
  expect(limitError).toBeInTheDocument();
});

it('shows total check limit over scripted check limit error if both are reached', async () => {
  await renderOverLimitAlert({ checkLimit: 1, scriptedLimit: 0 });
  const limitError = await screen.findByText(/You have reached your check limit of /);
  expect(limitError).toBeInTheDocument();
  expect(
    screen.queryByText(/You have reached the limit of scripted and multiHTTP checks you can create./)
  ).not.toBeInTheDocument();
});
