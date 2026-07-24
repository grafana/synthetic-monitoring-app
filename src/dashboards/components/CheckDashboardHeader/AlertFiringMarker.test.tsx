import React from 'react';
import { render, screen } from '@testing-library/react';

import { MetricAlertModel } from './health/checkHealth.types';
import { CheckAlertType } from 'types';

import { AlertFiringMarker } from './AlertFiringMarker';

function renderMarker(alert: MetricAlertModel) {
  return render(<AlertFiringMarker alert={alert} metricLabel="Reachability" />);
}

describe('AlertFiringMarker', () => {
  it('renders a bolt marker for a single historical firing', () => {
    renderMarker({
      state: 'historical',
      alertType: CheckAlertType.ProbeFailedExecutionsTooHigh,
      fireCount: 1,
    });

    expect(
      screen.getByRole('status', { name: 'Alert fired once in this range for Reachability' })
    ).toBeVisible();
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('shows a compact count when the alert fired multiple times', () => {
    renderMarker({
      state: 'historical',
      alertType: CheckAlertType.ProbeFailedExecutionsTooHigh,
      fireCount: 3,
    });

    expect(
      screen.getByRole('status', {
        name: 'Alert fired 3 times in this range for Reachability',
      })
    ).toHaveTextContent('×3');
  });

  it('describes a currently firing alert', () => {
    renderMarker({
      state: 'firing',
      alertType: CheckAlertType.ProbeFailedExecutionsTooHigh,
      fireCount: 2,
    });

    expect(
      screen.getByRole('status', {
        name: 'Alert is firing · 2 episodes in this range for Reachability',
      })
    ).toHaveTextContent('×2');
  });

  it('hides for non-firing alert states', () => {
    renderMarker({
      state: 'configured',
      alertType: CheckAlertType.ProbeFailedExecutionsTooHigh,
      fireCount: 3,
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hides when there are no firings in range', () => {
    renderMarker({
      state: 'historical',
      alertType: CheckAlertType.ProbeFailedExecutionsTooHigh,
      fireCount: 0,
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
