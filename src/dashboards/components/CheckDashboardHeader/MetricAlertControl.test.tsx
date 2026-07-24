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
  QuickAlertSetup: ({
    mode,
    onSaved,
  }: {
    mode?: 'create' | 'edit';
    onSaved: () => void;
  }) => (
    <div aria-label={mode === 'edit' ? 'View Average latency alert' : 'Set up Average latency alert'} role="dialog">
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
    ['pending', 'Alert setup pending for Average latency'],
    ['error', 'Alert setup failed for Average latency'],
  ] as const)('shows an accompanying setup status icon for %s without replacing the action', (state, label) => {
    renderControl(state, true);

    expect(screen.getByLabelText(label)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View alert for Average latency' })).toHaveTextContent('View alert');
  });

  it('keeps firing and historical markers out of the header action', () => {
    renderControl('firing', true);

    expect(screen.getByRole('button', { name: 'View alert for Average latency' })).toHaveTextContent('View alert');
    expect(screen.queryByLabelText(/Alert (firing|fired)/i)).not.toBeInTheDocument();
  });

  it('keeps configured alerts on View alert without a status icon', () => {
    renderControl('configured', true);

    expect(screen.getByRole('button', { name: 'View alert for Average latency' })).toHaveTextContent('View alert');
    expect(screen.queryByLabelText(/Alert setup/)).not.toBeInTheDocument();
  });

  it('does not replace the action with Fired or Firing state text', () => {
    renderControl('historical', true);

    expect(screen.getByRole('button', { name: 'View alert for Average latency' })).toHaveTextContent('View alert');
    expect(screen.queryByText('Fired')).not.toBeInTheDocument();
    expect(screen.queryByText('Firing')).not.toBeInTheDocument();
  });

  it('offers setup only when the user can write alerts', async () => {
    const user = userEvent.setup();

    renderControl('not-configured', true);
    expect(screen.getByRole('button', { name: 'Set up alert for Average latency' })).toHaveTextContent(
      'Set up alert'
    );
    await user.click(screen.getByRole('button', { name: 'Set up alert for Average latency' }));

    expect(screen.getByRole('dialog', { name: 'Set up Average latency alert' })).toBeVisible();
  });

  it('opens the edit dialog from View alert when an alert exists', async () => {
    const user = userEvent.setup();

    renderControl('configured', true);
    await user.click(screen.getByRole('button', { name: 'View alert for Average latency' }));

    expect(screen.getByRole('dialog', { name: 'View Average latency alert' })).toBeVisible();
  });

  it('does not offer an interactive setup control without write access', () => {
    renderControl('not-configured', false);

    expect(screen.queryByRole('button', { name: 'Set up alert for Average latency' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('No alert configured for Average latency')).toBeInTheDocument();
    expect(screen.getByText('No alert')).toBeVisible();
  });
});
