import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HEALTH_EXPLANATION_PRIORITY, HealthEvidence, HealthState } from './health/checkHealth.types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { AlertHealthSummary } from './AlertHealthSummary';

const range = { from: 1_000, to: 2_000 };

function evidence(
  id: string,
  state: HealthState,
  kind: HealthEvidence['kind'] = 'guardrail',
  scope: HealthEvidence['scope'] = 'evaluation'
): HealthEvidence {
  return {
    id,
    kind,
    metricId: 'reachability',
    state,
    summary: id,
    detail: `${id} detail`,
    range,
    scope,
    explanationPriority: HEALTH_EXPLANATION_PRIORITY[kind],
  };
}

function renderSummary({
  healthEvidence,
  qualifiers = [],
  rangeMode = 'live',
}: {
  healthEvidence: HealthEvidence[];
  qualifiers?: string[];
  rangeMode?: AppTimeRangeMode;
}) {
  const model = resolveCheckHealth({
    metricIds: ['reachability'],
    evidence: healthEvidence,
    qualifiers,
    rangeMode,
    evaluationAt: range.to,
  });

  return render(
    <CheckHealthProvider value={model}>
      <AlertHealthSummary />
    </CheckHealthProvider>
  );
}

describe('AlertHealthSummary', () => {
  it.each([
    ['healthy', 'Healthy now'],
    ['degraded', 'Degraded now'],
    ['unhealthy', 'Unhealthy now'],
    ['unknown', 'Health unknown now'],
  ] as const)('renders the resolved %s state', (state, label) => {
    renderSummary({ healthEvidence: [evidence(`${label} reason`, state)] });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent(label);
  });

  it.each([
    ['healthy', 'Healthy at end of range'],
    ['degraded', 'Degraded at end of range'],
    ['unhealthy', 'Unhealthy at end of range'],
    ['unknown', 'Health unknown at end of range'],
  ] as const)('uses historical tense for the resolved %s state', (state, label) => {
    renderSummary({
      healthEvidence: [evidence(`${label} reason`, state)],
      rangeMode: 'historical',
    });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent(label);
  });

  it('keeps the live headline healthy while explaining an earlier incident in the range', () => {
    renderSummary({
      healthEvidence: [
        evidence('Reachability alert is not firing', 'healthy', 'alert'),
        evidence('Reachability was critical earlier in this range', 'unhealthy', 'alert', 'range'),
      ],
    });

    const status = screen.getByRole('status', { name: 'Check health' });
    expect(status).toHaveTextContent('Healthy now');
    expect(status).toHaveTextContent('Reachability was critical earlier in this range');
    expect(status).not.toHaveTextContent(/^Unhealthy/);
  });

  it('shows no more than two leading reasons and retains the full evidence list in a toggletip', async () => {
    const user = userEvent.setup();

    renderSummary({
      healthEvidence: [
        evidence('Alert firing', 'unhealthy', 'alert'),
        evidence('Absolute threshold breached', 'unhealthy', 'guardrail'),
        evidence('Baseline regression', 'unhealthy', 'baseline'),
      ],
    });

    const status = screen.getByRole('status', { name: 'Check health' });
    expect(status).toHaveTextContent('Alert firing');
    expect(status).toHaveTextContent('Absolute threshold breached');
    expect(status).not.toHaveTextContent('Baseline regression');

    await user.click(screen.getByRole('button', { name: 'View health evidence' }));

    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Baseline regression');
    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Baseline regression detail');
    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Evaluation point');
    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Selected range');
  });

  it('shows selected-range qualifiers without replacing the known health state', () => {
    renderSummary({
      healthEvidence: [evidence('Reachability is at least 99.5%', 'healthy')],
      qualifiers: ['Normal not established yet'],
    });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent('Healthy');
    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent('Normal not established yet');
  });
});
