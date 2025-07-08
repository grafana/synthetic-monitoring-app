import React from 'react';
import { useDataTransformer, useQueryRunner, useTimeRange, useVariableInterpolator } from '@grafana/scenes-react';
import { Grid } from '@grafana/ui';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { WEB_VITAL_CONFIG, WebVitalConfig } from 'scenes/BrowserDashboard/WebVitals/types';
import { WebVitalGauge } from 'scenes/BrowserDashboard/WebVitals/WebVitalGauge';

export const WebVitalsAverageRow = () => {
  return (
    <Grid columns={6}>
      <WebVital vital={WEB_VITAL_CONFIG.fcp} />
      <WebVital vital={WEB_VITAL_CONFIG.lcp} />
      <WebVital vital={WEB_VITAL_CONFIG.ttfb} />
      <WebVital vital={WEB_VITAL_CONFIG.cls} />
      <WebVital vital={WEB_VITAL_CONFIG.fid} />
      <WebVital vital={WEB_VITAL_CONFIG.inp} />
    </Grid>
  );
};

const WebVital = ({ vital }: { vital: WebVitalConfig }) => {
  const metricsDS = useMetricsDS();
  const [currentTimeRange] = useTimeRange();
  const query = {
    refId: `wv-${vital.name}`,
    expr: `avg by (instance, job) (quantile_over_time(0.75, probe_browser_web_vital_${vital.name}{instance="$instance", job="$job", probe=~"$probe"}[$__range]))`,
    range: true,
  };

  const interpolate = useVariableInterpolator({
    variables: ['instance', 'job', 'probe'],
  });

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: metricsDS,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers: ['mean'],
        },
      },
    ],
  });

  const { data } = dataTransformer.useState();
  const value = data?.series[0]?.fields[1].values[0] ?? 0;
  const exploreLink = `/explore?left=${encodeURIComponent(
    JSON.stringify({
      datasource: metricsDS,
      queries: [
        {
          ...query,
          expr: interpolate(query.expr),
        },
      ],
      range: {
        from: currentTimeRange.from,
        to: currentTimeRange.to,
      },
    })
  )}`;

  return (
    <WebVitalGauge
      name={vital.name}
      longName={vital.longName}
      value={value}
      description={vital.description}
      exploreLink={exploreLink}
    />
  );
};
