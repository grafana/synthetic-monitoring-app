import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { MetricAlertState } from './health/checkHealth.types';
import { CheckAlertType } from 'types';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { MetricAlertControl } from './MetricAlertControl';

jest.mock('./QuickAlertSetup', () => ({
  QuickAlertSetup: ({ onSaved }: { onSaved: () => void }) => (
    <div aria-label="Set up Average latency alert" role="dialog">
      <button onClick={onSaved} type="button">
        Save alert
      </button>
    </div>
  ),
}));

const metric: HeaderMetricDefinition = {
  id: 'average-latency',
  label: 'Average latency',
  description: 'Average latency',
  definition: {
    id: 'average-latency',
    pluginId: 'stat',
    targets: [],
    fieldConfig: { defaults: {}, overrides: [] },
    options: {},
  },
  selectValue: () => null,
  formatValue: () => 'N/A',
  health: { alertTypes: [CheckAlertType.HTTPRequestDurationTooHighAvg] },
};

function renderControl(state: MetricAlertState, canWrite = false) {
  const model = resolveCheckHealth({
    metricIds: [metric.id],
    evidence: [],
    rangeMode: 'live',
    evaluationAt: 1,
    alerts: {
      [metric.id]: {
        state,
        alertType: CheckAlertType.HTTPRequestDurationTooHighAvg,
        canWrite,
      },
    },
  });

  return render(
    <CheckHealthProvider value={model}>
      <MetricAlertControl check={BASIC_HTTP_CHECK} metric={metric} />
    </CheckHealthProvider>
  );
}

describe('MetricAlertControl', () => {
  it.each([
    ['firing', 'Alert firing for Average latency'],
    ['historical', 'Alert fired in this range for Average latency'],
    ['configured', 'Alert configured for Average latency'],
    ['pending', 'Alert setup pending for Average latency'],
    ['error', 'Alert setup failed for Average latency'],
  ] as const)('renders %s state accessibly', (state, label) => {
    renderControl(state);

    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it('offers setup only when the user can write alerts', async () => {
    const user = userEvent.setup();

    renderControl('not-configured', true);
    await user.click(screen.getByRole('button', { name: 'Set up alert for Average latency' }));

    expect(screen.getByRole('dialog', { name: 'Set up Average latency alert' })).toBeVisible();
  });

  it('does not offer an interactive setup control without write access', () => {
    renderControl('not-configured', false);

    expect(screen.queryByRole('button', { name: 'Set up alert for Average latency' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('No alert configured for Average latency')).toBeInTheDocument();
  });
});
