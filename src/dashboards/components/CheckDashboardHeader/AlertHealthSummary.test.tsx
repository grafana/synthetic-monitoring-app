import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  HEALTH_EXPLANATION_PRIORITY,
  HealthEvidence,
  HealthState,
  MetricAlertModel,
} from './health/checkHealth.types';
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
  alerts = {},
}: {
  healthEvidence: HealthEvidence[];
  qualifiers?: string[];
  rangeMode?: AppTimeRangeMode;
  alerts?: Record<string, MetricAlertModel>;
}) {
  const model = resolveCheckHealth({
    metricIds: ['reachability'],
    evidence: healthEvidence,
    qualifiers,
    alerts,
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

  it('always reports how many alerts fired in the selected range', () => {
    renderSummary({
      healthEvidence: [evidence('Reachability alert is firing', 'unhealthy', 'alert')],
      alerts: { reachability: { state: 'firing', fireCount: 3 } },
    });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent(
      '3 alerts fired in the selected range'
    );
  });

  it('reports zero fired alerts when none fired', () => {
    renderSummary({
      healthEvidence: [evidence('Reachability is at least 99.5%', 'healthy')],
    });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent(
      '0 alerts fired in the selected range'
    );
  });

  it('labels each reason with the source tier that produced it', () => {
    renderSummary({
      healthEvidence: [
        evidence('Uptime is below its comparison', 'unhealthy', 'baseline'),
        evidence('Reachability alert is firing', 'unhealthy', 'alert'),
      ],
    });

    const status = screen.getByRole('status', { name: 'Check health' });
    expect(status).toHaveTextContent('Comparison signal:');
    expect(status).toHaveTextContent('Alert rule signal:');
  });

  it('presents the full evidence as a table with each signal source', async () => {
    const user = userEvent.setup();

    renderSummary({
      healthEvidence: [
        evidence('Reachability alert is firing', 'unhealthy', 'alert'),
        evidence('Uptime is below its comparison', 'unhealthy', 'baseline', 'range'),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'View health evidence' }));

    const tip = screen.getByTestId('toggletip-content');
    expect(tip).toHaveTextContent('Signal');
    expect(tip).toHaveTextContent('Source');
    expect(tip).toHaveTextContent('Baseline / threshold');
    expect(tip).toHaveTextContent('State');
    expect(tip).toHaveTextContent('Alert rule');
    expect(tip).toHaveTextContent('Comparison');
  });

  it('shows selected-range qualifiers without replacing the known health state', () => {
    renderSummary({
      healthEvidence: [evidence('Reachability is at least 99.5%', 'healthy')],
      qualifiers: ['Normal not established yet'],
    });

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent('Healthy');
    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent('Normal not established yet');
  });

  it('renders status reasons in headline metric order', () => {
    const model = resolveCheckHealth({
      metricIds: ['uptime', 'reachability', 'average-latency', 'ssl-expiry'],
      evidence: [
        {
          ...evidence('SSL expiry: certificate expires in under 7 days', 'unhealthy'),
          metricId: 'ssl-expiry',
        },
        {
          ...evidence('Uptime is below 99%', 'unhealthy'),
          metricId: 'uptime',
        },
        {
          ...evidence('Reachability was critical earlier in this range', 'unhealthy', 'guardrail', 'range'),
          metricId: 'reachability',
        },
      ],
      rangeMode: 'historical',
      evaluationAt: range.to,
    });

    render(
      <CheckHealthProvider value={model}>
        <AlertHealthSummary />
      </CheckHealthProvider>
    );

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent(
      /Uptime is below 99%.*Reachability was critical earlier in this range.*SSL expiry: certificate expires in under 7 days/
    );
  });

  it('dedupes identical evaluation and range summaries in the status bar', async () => {
    const user = userEvent.setup();
    const model = resolveCheckHealth({
      metricIds: ['uptime', 'ssl-expiry'],
      evidence: [
        {
          ...evidence('SSL expiry: certificate expires in under 7 days', 'unhealthy'),
          metricId: 'ssl-expiry',
        },
        {
          ...evidence('SSL expiry: certificate expires in under 7 days', 'unhealthy', 'guardrail', 'range'),
          id: 'SSL expiry range',
          metricId: 'ssl-expiry',
        },
        {
          ...evidence('Uptime is within normal range', 'healthy'),
          metricId: 'uptime',
        },
        {
          ...evidence('Uptime is within normal range', 'healthy', 'baseline', 'range'),
          id: 'Uptime range',
          metricId: 'uptime',
        },
      ],
      rangeMode: 'live',
      evaluationAt: range.to,
    });

    render(
      <CheckHealthProvider value={model}>
        <AlertHealthSummary />
      </CheckHealthProvider>
    );

    const status = screen.getByRole('status', { name: 'Check health' });
    expect(status).toHaveTextContent('Unhealthy now');
    expect(status.textContent?.match(/SSL expiry: certificate expires in under 7 days/g)).toHaveLength(1);
    expect(status).not.toHaveTextContent('Uptime is within normal range');

    await user.click(screen.getByRole('button', { name: 'View health evidence' }));

    const tip = screen.getByTestId('toggletip-content');
    expect(tip).toHaveTextContent('Evaluation point');
    expect(tip).toHaveTextContent('Selected range');
    // Full evidence tip still lists both scopes even when the status bar is deduped.
    expect(tip.textContent?.match(/SSL expiry: certificate expires in under 7 days detail/g)).toHaveLength(2);
  });
});
