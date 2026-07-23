import { FieldType, LoadingState, PanelData } from '@grafana/data';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckAlertError, CheckAlertPublished, CheckAlertType } from 'types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';

import { getHttpHeaderMetrics } from '../httpHeaderMetrics';
import {
  buildHttpCheckHealthModel,
  HealthPanelQueryResult,
  resolveMetricAlertModel,
} from './HttpCheckHealthProvider';

const HOUR_MS = 60 * 60 * 1000;
const selectedRange = { from: 40 * 24 * HOUR_MS, to: 40 * 24 * HOUR_MS + HOUR_MS };

function panel(value: number | null, state = LoadingState.Done): HealthPanelQueryResult {
  const panelData: PanelData = {
    state,
    series:
      value === null
        ? []
        : [
            {
              fields: [{ name: 'Value', type: FieldType.number, config: {}, values: [value] }],
              length: 1,
            },
          ],
    timeRange: {} as PanelData['timeRange'],
  };

  if (state === LoadingState.Error) {
    panelData.errors = [new Error('Prometheus unavailable')];
  }

  return { panelData, isLoading: state === LoadingState.Loading };
}

function hourlyPanel(value: number, hours: number): HealthPanelQueryResult {
  const times = Array.from({ length: hours }, (_, index) => selectedRange.from - (hours - index) * HOUR_MS);

  return {
    isLoading: false,
    panelData: {
      state: LoadingState.Done,
      series: [
        {
          fields: [
            { name: 'Time', type: FieldType.time, config: {}, values: times },
            { name: 'Value', type: FieldType.number, config: {}, values: times.map(() => value) },
          ],
          length: times.length,
        },
      ],
      timeRange: {} as PanelData['timeRange'],
    },
  };
}

function trendPanel(values: number[]): HealthPanelQueryResult {
  const duration = selectedRange.to - selectedRange.from;
  const times = values.map((_, index) =>
    selectedRange.from + (index * duration) / Math.max(values.length - 1, 1)
  );

  return {
    isLoading: false,
    panelData: {
      state: LoadingState.Done,
      series: [
        {
          fields: [
            { name: 'Time', type: FieldType.time, config: {}, values: times },
            { name: 'Value', type: FieldType.number, config: {}, values },
          ],
          length: values.length,
        },
      ],
      timeRange: {} as PanelData['timeRange'],
    },
  };
}

function configuredAlert(type: CheckAlertType): CheckAlertPublished {
  const fixture = BASIC_CHECK_ALERTS.alerts.find((alert) => alert.name === type);

  if (!fixture) {
    throw new Error(`Missing alert fixture for ${type}`);
  }

  return fixture;
}

function buildModel({
  reachability = panel(1),
  latency = panel(0.2),
  reachabilityBaseline = hourlyPanel(1, 30 * 24),
  latencyBaseline = hourlyPanel(0.2, 30 * 24),
  alerts = [],
  firingEpisodes = [],
  runtimeAlertNames = new Set<string>(),
  rangeMode = 'historical',
  series = {
    uptime: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
    reachability: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
    latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
    ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
  },
}: {
  reachability?: HealthPanelQueryResult;
  latency?: HealthPanelQueryResult;
  reachabilityBaseline?: HealthPanelQueryResult;
  latencyBaseline?: HealthPanelQueryResult;
  alerts?: CheckAlertPublished[];
  firingEpisodes?: Array<{ alertName: string; from: number; to: number }>;
  runtimeAlertNames?: Set<string>;
  rangeMode?: AppTimeRangeMode;
  series?: {
    uptime: HealthPanelQueryResult;
    reachability: HealthPanelQueryResult;
    latency: HealthPanelQueryResult;
    ssl: HealthPanelQueryResult;
  };
} = {}) {
  return buildHttpCheckHealthModel({
    check: { ...BASIC_HTTP_CHECK, frequency: 60_000 },
    metrics: getHttpHeaderMetrics(BASIC_HTTP_CHECK),
    selected: {
      uptime: panel(1),
      reachability,
      latency,
      ssl: panel(60 * 86_400),
    },
    baseline: {
      uptime: hourlyPanel(1, 30 * 24),
      reachability: reachabilityBaseline,
      latency: latencyBaseline,
    },
    series,
    alerts,
    runtimeAlertNames,
    firingEpisodes,
    pendingEpisodes: [],
    canReadAlerts: true,
    canWriteAlerts: true,
    selectedRange,
    rangeMode,
  });
}

describe('buildHttpCheckHealthModel', () => {
  it('reports baseline degradation even when a configured alert is inactive', () => {
    const model = buildModel({
      latency: panel(0.6),
      alerts: [configuredAlert(CheckAlertType.HTTPRequestDurationTooHighAvg)],
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('unhealthy');
    expect(model.rangeReasons.map((reason) => reason.summary)).toContain('Average latency is well above normal');
  });

  it('uses guardrails and says normal is not established below twenty-four hours', () => {
    const model = buildModel({
      reachability: panel(0.997),
      reachabilityBaseline: hourlyPanel(1, 18),
    });

    expect(model.state).toBe('healthy');
    expect(model.qualifiers).toContain('Normal not established yet');
  });

  it('maps a named historical alert episode to reachability', () => {
    const model = buildModel({
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      firingEpisodes: [
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from,
          to: selectedRange.from + 1_000,
        },
      ],
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('unhealthy');
    expect(model.metrics.reachability.alert.state).toBe('historical');
    expect(model.rangeReasons.map((reason) => reason.summary)).toContain(
      'Reachability was critical earlier in this range'
    );
  });

  it('keeps known unhealthy evidence visible while a baseline query loads', () => {
    const model = buildModel({
      reachability: panel(0.5),
      reachabilityBaseline: panel(null, LoadingState.Loading),
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('unhealthy');
    expect(model.rangeReasons.map((reason) => reason.summary)).toContain('Reachability is below 99%');
  });

  it('distinguishes failed baseline loading from insufficient history', () => {
    const model = buildModel({
      latencyBaseline: panel(null, LoadingState.Error),
    });

    expect(model.state).toBe('healthy');
    expect(model.qualifiers).toContain('Some health evidence is unavailable');
    expect(model.qualifiers).not.toContain('Normal not established yet');
    expect(model.hasPartialEvidence).toBe(true);
  });

  it('reports current incidents only while the selected range is historical', () => {
    const runtimeAlertNames = new Set<string>([CheckAlertType.ProbeFailedExecutionsTooHigh]);

    expect(buildModel({ runtimeAlertNames, rangeMode: 'historical' }).liveIncidentCount).toBe(1);
    expect(buildModel({ runtimeAlertNames, rangeMode: 'live' }).liveIncidentCount).toBe(0);
  });

  it('keeps the evaluation point healthy after an earlier alerted incident', () => {
    const model = buildModel({
      reachability: panel(0.6),
      alerts: [
        {
          ...configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh),
          period: '5m',
        },
      ],
      firingEpisodes: [
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from + 10 * 60_000,
          to: selectedRange.from + 30 * 60_000,
        },
      ],
      rangeMode: 'live',
      series: {
        uptime: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
        reachability: trendPanel([1, 1, 0, 0, 0, 1, 1, 1]),
        latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
        ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
      },
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('unhealthy');
    expect(model.metrics.reachability.state).toBe('healthy');
    expect(model.metrics.reachability.rangeState).toBe('unhealthy');
    expect(model.metrics.reachability.trend?.label).toBe('Recovered earlier in this range');
  });

  it('uses the alert state at the end of a historical range', () => {
    const model = buildModel({
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      firingEpisodes: [
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from,
          to: selectedRange.to - 10_000,
        },
      ],
      rangeMode: 'historical',
    });

    expect(model.state).toBe('unhealthy');
    expect(model.compactReasons.map(({ summary }) => summary)).toContain(
      'Reachability alert was still firing when this range ended'
    );
  });

  it('does not let a current runtime alert contaminate historical endpoint health', () => {
    const model = buildModel({
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      runtimeAlertNames: new Set([CheckAlertType.ProbeFailedExecutionsTooHigh]),
      rangeMode: 'historical',
    });

    expect(model.state).toBe('healthy');
    expect(model.liveIncidentCount).toBe(1);
  });

  it('uses learned normal and guardrails when no alert is configured', () => {
    const returnedSeries = {
      uptime: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
      reachability: trendPanel([1, 1, 0, 0, 0, 1, 1, 1]),
      latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
      ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
    };
    const baselineModel = buildModel({
      reachability: panel(0.6),
      rangeMode: 'live',
      series: returnedSeries,
    });
    const guardrailModel = buildModel({
      reachability: panel(0.6),
      reachabilityBaseline: hourlyPanel(1, 18),
      rangeMode: 'live',
      series: returnedSeries,
    });

    expect(baselineModel.metrics.reachability.trend?.label).toBe('Returned to its normal range');
    expect(guardrailModel.metrics.reachability.trend?.label).toBe('Back within the expected range');
    expect(baselineModel.state).toBe('healthy');
    expect(guardrailModel.state).toBe('healthy');
  });

  it('describes a flat alerted outage as unavailable', () => {
    const model = buildModel({
      reachability: panel(0),
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      runtimeAlertNames: new Set([CheckAlertType.ProbeFailedExecutionsTooHigh]),
      rangeMode: 'live',
      series: {
        uptime: trendPanel([0, 0, 0, 0, 0, 0, 0, 0]),
        reachability: trendPanel([0, 0, 0, 0, 0, 0, 0, 0]),
        latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
        ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
      },
    });

    expect(model.metrics.reachability.trend?.label).toBe('Unavailable throughout this range');
  });

  it('does not describe improving telemetry as recovered while its alert is firing', () => {
    const model = buildModel({
      reachability: panel(0.6),
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      runtimeAlertNames: new Set([CheckAlertType.ProbeFailedExecutionsTooHigh]),
      rangeMode: 'live',
      series: {
        uptime: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
        reachability: trendPanel([1, 1, 0, 0, 0, 1, 1, 1]),
        latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
        ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
      },
    });

    expect(model.metrics.reachability.trend?.label).toBe('Recovering but still critical');
    expect(model.metrics.reachability.trend?.label).not.toContain('Recovered');
  });

  it('leaves endpoint health unknown when fewer than three tail buckets are available', () => {
    const model = buildModel({
      series: {
        uptime: trendPanel([1, 1, 1, 1, 1, 1, 1, 1]),
        reachability: trendPanel([1, 1]),
        latency: trendPanel([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
        ssl: trendPanel([60, 59, 58, 57, 56, 55, 54, 53].map((days) => days * 86_400)),
      },
    });

    expect(model.metrics.reachability.state).toBe('unknown');
    expect(model.metrics.reachability.trend?.label).toBe('Trend not established');
  });

  it('treats the normal certificate countdown as on track', () => {
    const model = buildModel({ rangeMode: 'live' });

    expect(model.metrics['ssl-expiry'].trend?.label).toBe('On track for renewal');
  });
});

describe('resolveMetricAlertModel', () => {
  it('prioritises configuration errors and pending publication', () => {
    const configured = configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh);

    expect(
      resolveMetricAlertModel({
        alertType: configured.name,
        configured: { ...configured, error: CheckAlertError.InternalError },
        isFiring: true,
        hasHistoricalEpisode: true,
        canWrite: true,
      }).state
    ).toBe('error');

    expect(
      resolveMetricAlertModel({
        alertType: configured.name,
        configured: { ...configured, status: 'PENDING_UPDATE' },
        isFiring: true,
        hasHistoricalEpisode: true,
        canWrite: true,
      }).state
    ).toBe('pending');
  });

  it('distinguishes firing, historical, configured, and absent alerts', () => {
    const configured = configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh);
    const common = { alertType: configured.name, canWrite: true };

    expect(
      resolveMetricAlertModel({
        ...common,
        configured,
        isFiring: true,
        hasHistoricalEpisode: true,
      }).state
    ).toBe('firing');
    expect(
      resolveMetricAlertModel({
        ...common,
        configured,
        isFiring: false,
        hasHistoricalEpisode: true,
      }).state
    ).toBe('historical');
    expect(
      resolveMetricAlertModel({
        ...common,
        configured,
        isFiring: false,
        hasHistoricalEpisode: false,
      }).state
    ).toBe('configured');
    expect(
      resolveMetricAlertModel({
        ...common,
        isFiring: false,
        hasHistoricalEpisode: false,
      }).state
    ).toBe('not-configured');
  });
});
