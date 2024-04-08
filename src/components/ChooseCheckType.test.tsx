import React from 'react';
import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { FeatureName } from 'types';

import { ChooseCheckType } from './ChooseCheckType';

function renderChooseCheckType({ checkLimit = 10, scriptedLimit = 10 }) {
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
  return render(<ChooseCheckType />);
}
it('shows check type options with scripted feature off', async () => {
  renderChooseCheckType({});
  const checkTypes = ['HTTP', 'TCP', 'DNS', 'PING', 'MULTIHTTP', 'Traceroute'];
  const cards = await Promise.all(
    checkTypes.map((checkType) => {
      return screen.findByText(checkType);
    })
  );
  cards.forEach((card) => {
    expect(card).toBeInTheDocument();
  });
});

it('shows check type options with scripted feature on', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  renderChooseCheckType({});
  const checkTypes = ['HTTP', 'TCP', 'DNS', 'PING', 'MULTIHTTP', 'Traceroute', 'Scripted'];
  const cards = await Promise.all(
    checkTypes.map((checkType) => {
      return screen.findByText(checkType);
    })
  );
  cards.forEach((card) => {
    expect(card).toBeInTheDocument();
  });
});

it('shows error alert when check limit is reached', async () => {
  renderChooseCheckType({ checkLimit: 1 });
  const errorAlert = await screen.findByText('Check limit reached');
  expect(errorAlert).toBeInTheDocument();
  const checkTypes = ['HTTP', 'TCP', 'DNS', 'PING', 'MULTIHTTP', 'Traceroute', 'Scripted'];
  const cards = await Promise.all(
    checkTypes.map((checkType) => {
      return screen.queryByText(checkType);
    })
  );
  cards.forEach((card) => {
    expect(card).not.toBeInTheDocument();
  });
});

it('shows error alert when scripted check limit is reached', async () => {
  // @ts-ignore
  config.featureToggles[FeatureName.ScriptedChecks] = true;
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  renderChooseCheckType({ checkLimit: 10, scriptedLimit: 1 });
  const errorAlert = await screen.findByText('Scripted check limit reached');
  expect(errorAlert).toBeInTheDocument();
  const checkTypes = ['HTTP', 'TCP', 'DNS', 'PING', 'Traceroute'];
  const cards = await Promise.all(
    checkTypes.map((checkType) => {
      return screen.findByText(checkType);
    })
  );
  cards.forEach((card) => {
    expect(card).toBeInTheDocument();
  });
  expect(screen.queryByText('MULTIHTTP')).not.toBeInTheDocument();
  expect(screen.queryByText('Scripted')).not.toBeInTheDocument();
});
