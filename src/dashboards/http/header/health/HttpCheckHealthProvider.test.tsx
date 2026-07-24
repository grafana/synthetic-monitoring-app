import React from 'react';
import { FieldType, LoadingState, PanelData } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import { useDashboardAlertEpisodes } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { AlertHealthSummary } from 'dashboards/components/CheckDashboardHeader/AlertHealthSummary';
import { useCheckHealth } from 'dashboards/components/CheckDashboardHeader/health/CheckHealthContext';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckAlertError, CheckAlertPublished, CheckAlertType } from 'types';
import { useAppTime } from 'contexts/AppTimeProvider';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';
import {
  DashboardComparisonContextValue,
  useDashboardComparison,
} from 'contexts/DashboardComparisonProvider';
import { useListAlertsForCheck } from 'data/useCheckAlerts';
import { useChecksAlertStates } from 'data/useCheckAlertStates';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';

import { getHttpHeaderMetrics } from '../httpHeaderMetrics';
import {
  buildHttpCheckHealthModel,
  HealthPanelQueryResult,
  HttpCheckHealthProvider,
  resolveMetricAlertModel,
} from './HttpCheckHealthProvider';

jest.mock('contexts/AppTimeProvider', () => ({ useAppTime: jest.fn() }));
jest.mock('contexts/DashboardComparisonProvider', () => ({ useDashboardComparison: jest.fn() }));
jest.mock('data/useCheckAlerts', () => ({ useListAlertsForCheck: jest.fn() }));
jest.mock('data/useCheckAlertStates', () => ({
  getCheckRuntimeAlertState: jest.requireActual('data/useCheckAlertStates').getCheckRuntimeAlertState,
  useChecksAlertStates: jest.fn(),
}));
jest.mock('dashboards/annotations/DashboardAnnotationsProvider', () => ({
  useDashboardAlertEpisodes: jest.fn(),
}));
jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({ useDashboardPanelQuery: jest.fn() }));
jest.mock('hooks/useAlertAccessControl', () => ({ useAlertAccessControl: jest.fn() }));

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const selectedRange = { from: 40 * 24 * HOUR_MS, to: 40 * 24 * HOUR_MS + HOUR_MS };
const defaultHealthReference = {
  status: 'available' as const,
  tierId: '30d' as const,
  range: { from: selectedRange.from - 30 * DAY_MS, to: selectedRange.from },
  coverage: 1,
  executionCount: 720,
};

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

function useModelSnapshot() {
  const model = useCheckHealth();

  return {
    state: model.state,
    reason: model.compactReasons.map(({ summary }) => summary),
    rangeState: model.rangeState,
    metrics: Object.fromEntries(
      Object.entries(model.metrics).map(([id, metric]) => [
        id,
        {
          state: metric.state,
          rangeState: metric.rangeState,
          alert: metric.alert,
          trend: metric.trend,
        },
      ])
    ),
    alertEvidence: model.evidence.filter(({ kind }) => kind === 'alert'),
    baselineEvidence: model.evidence.filter(({ kind }) => kind === 'baseline'),
    guardrailEvidence: model.evidence.filter(({ kind }) => kind === 'guardrail'),
    hasPartialEvidence: model.hasPartialEvidence,
    qualifiers: model.qualifiers,
  };
}

function HealthProbe() {
  const snapshot = useModelSnapshot();

  return (
    <>
      <output data-testid="health-model">{JSON.stringify(snapshot)}</output>
      <AlertHealthSummary />
    </>
  );
}

function setComparison(
  healthReference: DashboardComparisonContextValue['healthReference'],
  displayReference: DashboardComparisonContextValue['displayReference']
) {
  jest.mocked(useDashboardComparison).mockReturnValue({
    enabled: displayReference !== null,
    referenceSpec: displayReference?.spec ?? null,
    healthReference,
    displayReference,
    displayAvailability: null,
    automaticSelection: { status: 'inactive' },
    setEnabled: jest.fn(),
    setReference: jest.fn(),
    retryAutomaticSelection: jest.fn(),
  });
}

function mockProviderQueries() {
  jest.mocked(useDashboardPanelQuery).mockImplementation((definition) => {
    const result = (() => {
      switch (definition.id) {
        case 'http-uptime':
          return panel(1);
        case 'http-reachability':
          return panel(0.5);
        case 'http-average-latency':
          return panel(0.2);
        case 'http-ssl-expiry':
          return panel(60 * 86_400);
        case 'http-uptime-sparkline':
          return trendPanel([1, 1, 1, 1]);
        case 'http-reachability-sparkline':
          return trendPanel([1, 1, 1, 1]);
        case 'http-average-latency-sparkline':
          return trendPanel([0.2, 0.2, 0.2, 0.2]);
        case 'http-health-uptime-baseline':
          return hourlyPanel(1, 21 * 24);
        case 'http-health-reachability-baseline':
          return hourlyPanel(1, 14 * 24);
        case 'http-health-latency-baseline':
          return hourlyPanel(0.2, 21 * 24);
        default:
          throw new Error(`Unexpected HTTP health query: ${definition.id}`);
      }
    })();

    return result as ReturnType<typeof useDashboardPanelQuery>;
  });
}

function configuredAlert(type: CheckAlertType): CheckAlertPublished {
  const fixture = BASIC_CHECK_ALERTS.alerts.find((alert) => alert.name === type);

  if (!fixture) {
    throw new Error(`Missing alert fixture for ${type}`);
  }

  return fixture;
}

function renderProvider(metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK)) {
  return render(
    <HttpCheckHealthProvider check={BASIC_HTTP_CHECK} metrics={metrics}>
      <HealthProbe />
    </HttpCheckHealthProvider>
  );
}

function mockFiringReachabilityAlert() {
  const alertType = CheckAlertType.ProbeFailedExecutionsTooHigh;
  const checkKey = `${BASIC_HTTP_CHECK.job}\0${BASIC_HTTP_CHECK.target}`;

  jest.mocked(useAppTime).mockReturnValue({
    absolute: selectedRange,
    rangeMode: 'live',
  } as ReturnType<typeof useAppTime>);
  jest.mocked(useListAlertsForCheck).mockReturnValue({
    data: [configuredAlert(alertType)],
    error: null,
  } as unknown as ReturnType<typeof useListAlertsForCheck>);
  jest.mocked(useChecksAlertStates).mockReturnValue({
    data: {
      [checkKey]: {
        firingCount: 1,
        firingAlertNames: new Set([alertType]),
      },
    },
  } as unknown as ReturnType<typeof useChecksAlertStates>);
}

describe('HttpCheckHealthProvider', () => {
  const normalReference = {
    status: 'available' as const,
    tierId: '21d' as const,
    range: { from: selectedRange.from - 21 * DAY_MS, to: selectedRange.from },
    coverage: 0.9,
    executionCount: 500,
  };

  beforeEach(() => {
    jest.mocked(useAppTime).mockReturnValue({
      absolute: selectedRange,
      rangeMode: 'historical',
    } as ReturnType<typeof useAppTime>);
    setComparison(normalReference, null);
    mockProviderQueries();
    jest.mocked(useDashboardAlertEpisodes).mockReturnValue([]);
    jest.mocked(useAlertAccessControl).mockReturnValue({
      canReadAlerts: true,
      canWriteAlerts: true,
    } as ReturnType<typeof useAlertAccessControl>);
    jest.mocked(useListAlertsForCheck).mockReturnValue({
      data: [],
      error: null,
    } as unknown as ReturnType<typeof useListAlertsForCheck>);
    jest.mocked(useChecksAlertStates).mockReturnValue({
      data: {},
    } as unknown as ReturnType<typeof useChecksAlertStates>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses one provider-selected 21-day range for every metric baseline', () => {
    const metrics = getHttpHeaderMetrics(BASIC_HTTP_CHECK);
    renderProvider(metrics);

    const baselineCalls = jest
      .mocked(useDashboardPanelQuery)
      .mock.calls.filter(([definition]) => definition.id.includes('-baseline'));

    expect(baselineCalls).toHaveLength(3);
    expect(baselineCalls.map(([definition]) => definition)).toEqual(
      metrics.slice(0, 3).map((metric) => metric.comparison?.normalBaseline?.definition)
    );
    expect(baselineCalls.map(([, options]) => options)).toEqual([
      { range: normalReference.range, enabled: true },
      { range: normalReference.range, enabled: true },
      { range: normalReference.range, enabled: true },
    ]);

    const snapshot = JSON.parse(screen.getByTestId('health-model').textContent ?? '{}');
    expect(
      snapshot.baselineEvidence.filter(
        ({ metricId }: { metricId?: string }) => metricId === 'reachability'
      )
    ).toEqual([]);
    expect(
      snapshot.baselineEvidence.map(
        ({ detail, metricId }: { detail?: string; metricId?: string }) => ({ detail, metricId })
      )
    ).toEqual([
      { detail: 'Compared with the 21-day median', metricId: 'uptime' },
      { detail: 'Compared with the 21-day median', metricId: 'uptime' },
      { detail: 'Compared with the 21-day median', metricId: 'average-latency' },
      { detail: 'Compared with the 21-day median', metricId: 'average-latency' },
    ]);
    expect(snapshot.metrics.reachability.trend.source).toBe('guardrail');
    expect(snapshot.guardrailEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'evaluation:reachability',
          kind: 'guardrail',
        }),
      ])
    );
    expect(snapshot.qualifiers).toContain('Normal not established yet');
  });

  it('keeps health and summary wording independent of the display reference', () => {
    const rendered = renderProvider();
    const firstModel = screen.getByTestId('health-model').textContent;
    const firstSummary = screen.getByRole('status', { name: 'Check health' }).textContent;
    const firstColour = screen.getByRole('status', { name: 'Check health' }).parentElement?.className;

    setComparison(normalReference, {
      status: 'valid',
      spec: { kind: 'previous' },
      label: 'Previous period',
      range: {
        from: selectedRange.from - 2 * HOUR_MS,
        to: selectedRange.from - HOUR_MS,
      },
      equalDuration: true,
    });
    jest.mocked(useDashboardPanelQuery).mockClear();
    rendered.rerender(
      <HttpCheckHealthProvider check={BASIC_HTTP_CHECK} metrics={getHttpHeaderMetrics(BASIC_HTTP_CHECK)}>
        <HealthProbe />
      </HttpCheckHealthProvider>
    );

    expect(screen.getByTestId('health-model').textContent).toBe(firstModel);
    expect(screen.getByRole('status', { name: 'Check health' }).textContent).toBe(firstSummary);
    expect(screen.getByRole('status', { name: 'Check health' }).parentElement?.className).toBe(firstColour);

    const rerenderedBaselineCalls = jest
      .mocked(useDashboardPanelQuery)
      .mock.calls.filter(([definition]) => definition.id.includes('-baseline'));
    expect(
      rerenderedBaselineCalls.map(([definition, options]) => ({
        id: definition.id,
        options,
      }))
    ).toEqual([
      {
        id: 'http-health-uptime-baseline',
        options: { range: normalReference.range, enabled: true },
      },
      {
        id: 'http-health-reachability-baseline',
        options: { range: normalReference.range, enabled: true },
      },
      {
        id: 'http-health-latency-baseline',
        options: { range: normalReference.range, enabled: true },
      },
    ]);
  });

  it('keeps alerts and guardrails authoritative when Normal is not established', () => {
    setComparison({ status: 'not-established' }, null);
    mockFiringReachabilityAlert();

    renderProvider();

    const baselineCalls = jest
      .mocked(useDashboardPanelQuery)
      .mock.calls.filter(([definition]) => definition.id.includes('-baseline'));
    expect(baselineCalls.map(([, options]) => options?.enabled)).toEqual([false, false, false]);

    const snapshot = JSON.parse(screen.getByTestId('health-model').textContent ?? '{}');
    expect(snapshot.state).toBe('unhealthy');
    expect(snapshot.rangeState).toBe('unhealthy');
    expect(snapshot.alertEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: 'unhealthy',
          summary: 'Reachability alert is firing',
        }),
      ])
    );
    expect(snapshot.guardrailEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: 'unhealthy',
          summary: 'Reachability is below 99%',
        }),
      ])
    );
  });

  it.each([
    {
      healthReference: { status: 'checking' as const },
      qualifier: undefined,
    },
    {
      healthReference: { status: 'query-error' as const },
      qualifier: 'Some health evidence is unavailable',
    },
  ])(
    'keeps alerts and guardrails active while Normal is $healthReference.status',
    ({ healthReference, qualifier }) => {
      setComparison(healthReference, null);
      mockFiringReachabilityAlert();

      renderProvider();

      const baselineCalls = jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.filter(([definition]) => definition.id.includes('-baseline'));
      expect(baselineCalls.map(([, options]) => options?.enabled)).toEqual([false, false, false]);

      const snapshot = JSON.parse(screen.getByTestId('health-model').textContent ?? '{}');
      expect(snapshot.state).toBe('unhealthy');
      expect(snapshot.rangeState).toBe('unhealthy');
      expect(snapshot.baselineEvidence).toEqual([]);
      expect(snapshot.metrics.uptime.trend.source).toBe('guardrail');
      expect(snapshot.metrics.reachability.trend.source).toBe('alert');
      expect(snapshot.alertEvidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            state: 'unhealthy',
            summary: 'Reachability alert is firing',
          }),
        ])
      );
      expect(snapshot.guardrailEvidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            state: 'unhealthy',
            summary: 'Reachability is below 99%',
          }),
        ])
      );

      if (qualifier) {
        expect(snapshot.qualifiers).toContain(qualifier);
      } else {
        expect(snapshot.qualifiers).not.toContain('Some health evidence is unavailable');
        expect(snapshot.qualifiers).not.toContain('Normal not established yet');
      }
    }
  );
});

function buildModel({
  reachability = panel(1),
  latency = panel(0.2),
  reachabilityBaseline = hourlyPanel(1, 30 * 24),
  latencyBaseline = hourlyPanel(0.2, 30 * 24),
  alerts = [],
  firingEpisodes = [],
  runtimeAlertNames = new Set<string>(),
  rangeMode = 'historical',
  healthReference = defaultHealthReference,
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
  healthReference?: DashboardComparisonContextValue['healthReference'];
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
    healthReference,
  });
}

describe('buildHttpCheckHealthModel', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    expect(model.metrics.reachability.alert.fireCount).toBe(1);
    expect(model.rangeReasons.map((reason) => reason.summary)).toContain(
      'Reachability was critical earlier in this range'
    );
  });

  it('counts overlapping firing episodes for the metric alert model', () => {
    const model = buildModel({
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      firingEpisodes: [
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from,
          to: selectedRange.from + 1_000,
        },
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from + 2_000,
          to: selectedRange.from + 3_000,
        },
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.to + 10_000,
          to: selectedRange.to + 11_000,
        },
      ],
    });

    expect(model.metrics.reachability.alert).toMatchObject({
      state: 'historical',
      fireCount: 2,
    });
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

  it('treats terminal baseline frames with query errors as unavailable', () => {
    const partialBaseline = hourlyPanel(0.2, 30 * 24);
    partialBaseline.panelData.errors = [new Error('One baseline target failed')];

    const model = buildModel({
      latency: panel(0.6),
      latencyBaseline: partialBaseline,
    });

    expect(model.state).toBe('healthy');
    expect(model.rangeState).toBe('healthy');
    expect(model.rangeReasons.map((reason) => reason.summary)).not.toContain(
      'Average latency is well above normal'
    );
    expect(model.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'baseline:average-latency:error',
          state: 'unknown',
          summary: 'Average latency normal comparison is unavailable',
          detail: 'One baseline target failed',
        }),
      ])
    );
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
          // Within annotation-step tolerance (2 × 10s) of range.to → still firing.
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

  it('treats an alert as resolved at range end when the last sample is beyond step tolerance', () => {
    const model = buildModel({
      alerts: [configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh)],
      firingEpisodes: [
        {
          alertName: CheckAlertType.ProbeFailedExecutionsTooHigh,
          from: selectedRange.from,
          // ~79s before range.to — outside 20s annotation-step tolerance.
          to: selectedRange.to - 79_000,
        },
      ],
      rangeMode: 'historical',
    });

    expect(model.compactReasons.map(({ summary }) => summary)).toContain(
      'Reachability alert was not firing when this range ended'
    );
    expect(model.compactReasons.map(({ summary }) => summary)).not.toContain(
      'Reachability alert was still firing when this range ended'
    );
    expect(model.rangeReasons.map(({ summary }) => summary)).toContain(
      'Reachability was critical earlier in this range'
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
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 6, 23));
    const model = buildModel({ rangeMode: 'live' });

    expect(model.metrics['ssl-expiry'].trend?.label).toBe('On track for renewal · expires 2026-09-21');
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
        fireCount: 2,
      })
    ).toMatchObject({ state: 'firing', fireCount: 2 });
    expect(
      resolveMetricAlertModel({
        ...common,
        configured,
        isFiring: false,
        hasHistoricalEpisode: true,
        fireCount: 3,
      })
    ).toMatchObject({ state: 'historical', fireCount: 3 });
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

  it('ensures a live firing alert reports at least one fire', () => {
    const configured = configuredAlert(CheckAlertType.ProbeFailedExecutionsTooHigh);

    expect(
      resolveMetricAlertModel({
        alertType: configured.name,
        configured,
        isFiring: true,
        hasHistoricalEpisode: false,
        fireCount: 0,
        canWrite: true,
      }).fireCount
    ).toBe(1);
  });
});
