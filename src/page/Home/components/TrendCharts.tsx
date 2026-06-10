import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { Alert, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMetricsDS } from 'hooks/useMetricsDS';

const ERROR_RATE_QUERY = `1 - (
    sum(rate(probe_all_success_sum[$__rate_interval]))
    /
    sum(rate(probe_all_success_count[$__rate_interval]))
  )`;

const LATENCY_BY_CHECK_TYPE_QUERY = `(
    sum by (check_name) (
      rate(probe_all_duration_seconds_sum[$__rate_interval])
      * on (instance, job, probe, config_version) group_left(check_name)
        max by (instance, job, probe, config_version, check_name) (sm_check_info)
    )
  )
  /
  (
    sum by (check_name) (
      rate(probe_all_duration_seconds_count[$__rate_interval])
      * on (instance, job, probe, config_version) group_left(check_name)
        max by (instance, job, probe, config_version, check_name) (sm_check_info)
    )
  )`;

const ErrorRateViz = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: ERROR_RATE_QUERY,
        interval: '1m',
        legendFormat: 'Error rate',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('percentunit')
    .setMin(0)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('fillOpacity', 10)
    .setOption('tooltip', { mode: TooltipDisplayMode.Single, sort: SortOrder.None })
    .setOption('legend', { showLegend: false, displayMode: LegendDisplayMode.Hidden, placement: 'bottom', calcs: [] })
    .setColor({ mode: 'fixed', fixedColor: 'red' })
    .build();

  return <VizPanel title="Error rate (all checks)" viz={viz} dataProvider={dataProvider} />;
};

const LatencyByTypeViz = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: LATENCY_BY_CHECK_TYPE_QUERY,
        interval: '1m',
        legendFormat: '{{check_name}}',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('s')
    .setMin(0)
    .setCustomFieldConfig('spanNulls', true)
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi, sort: SortOrder.None })
    .setOption('legend', { showLegend: true, displayMode: LegendDisplayMode.List, placement: 'bottom', calcs: [] })
    .setColor({ mode: 'palette-classic' })
    .build();

  return <VizPanel title="Latency by check type" viz={viz} dataProvider={dataProvider} />;
};

export const TrendCharts = () => {
  const styles = useStyles2(getStyles);
  const metricsDS = useMetricsDS();

  if (!metricsDS) {
    return null;
  }

  return (
    <TrendChartsErrorBoundary>
      <div className={styles.charts} data-testid="trend-charts">
        <ErrorRateViz />
        <LatencyByTypeViz />
      </div>
    </TrendChartsErrorBoundary>
  );
};

// Keep scenes failures contained so they can't take down the KPI strip and triage list
class TrendChartsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TrendCharts failed to render', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Alert severity="warning" title="Unable to display trend charts" />;
    }

    return this.props.children;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  charts: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1),
    height: '300px',
    minHeight: 0,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      height: '600px',
    },
  }),
});
