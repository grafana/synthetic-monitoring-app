import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { WEB_VITAL_CONFIG } from './types';

import { WebVitalGaugeScene } from './webVitalGaugeScene';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'wv-ttfb',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_ttfb{instance="$instance", job="$job"}[$__rate_interval])`,
      },
      {
        refId: 'wv-fcp',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_fcp{instance="$instance", job="$job"}[$__rate_interval])`,
      },
      {
        refId: 'wv-lcp',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_lcp{instance="$instance", job="$job"}[$__rate_interval])`,
      },
      {
        refId: 'wv-cls',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_cls{instance="$instance", job="$job"}[$__rate_interval])`,
      },
      {
        refId: 'wv-fid',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_fid{instance="$instance", job="$job"}[$__rate_interval])`,
      },
      {
        refId: 'wv-inp',
        expr: `quantile_over_time(0.75, probe_browser_web_vital_inp{instance="$instance", job="$job"}[$__rate_interval])`,
      },
    ],
  });
}

export function getWebVitals(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    direction: 'column',
    $data: getQueryRunner(metrics),
    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 150,
        children: [
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'ttfb',
              longName: WEB_VITAL_CONFIG.ttfb.longName,
              description: WEB_VITAL_CONFIG.ttfb.description,
              refId: 'wv-ttfb',
            }),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'fcp',
              longName: WEB_VITAL_CONFIG.fcp.longName,
              description: WEB_VITAL_CONFIG.fcp.description,
              refId: 'wv-fcp',
            }),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'lcp',
              longName: WEB_VITAL_CONFIG.lcp.longName,
              description: WEB_VITAL_CONFIG.lcp.description,
              refId: 'wv-lcp',
            }),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'cls',
              longName: WEB_VITAL_CONFIG.cls.longName,
              description: WEB_VITAL_CONFIG.cls.description,
              refId: 'wv-cls',
            }),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'fid',
              longName: WEB_VITAL_CONFIG.fid.longName,
              description: WEB_VITAL_CONFIG.fid.description,
              refId: 'wv-fid',
            }),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: 'inp',
              longName: WEB_VITAL_CONFIG.inp.longName,
              description: WEB_VITAL_CONFIG.inp.description,
              refId: 'wv-inp',
            }),
          }),
        ],
      }),
    ],
  });
}
