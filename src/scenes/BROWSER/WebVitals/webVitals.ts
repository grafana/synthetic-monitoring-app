import { SceneDataTransformer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { WEB_VITAL_CONFIG } from './types';

import { WebVitalGaugeScene } from './webVitalGaugeScene';

function getQueryRunner(metrics: DataSourceRef, refId: string) {
  const queries = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: `wv-${refId}`,
        expr: `quantile_over_time(0.75, probe_browser_web_vital_${refId}{instance="$instance", job="$job"}[$__range])`,
      },
    ],
  });

  return new SceneDataTransformer({
    $data: queries,
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers: ['mean'],
        },
      },
    ],
  });
}

export function getWebVitals(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    direction: 'column',

    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 150,
        children: [
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.ttfb.name,
              longName: WEB_VITAL_CONFIG.ttfb.longName,
              description: WEB_VITAL_CONFIG.ttfb.description,
              refId: `wv-${WEB_VITAL_CONFIG.ttfb.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.ttfb.name),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.fcp.name,
              longName: WEB_VITAL_CONFIG.fcp.longName,
              description: WEB_VITAL_CONFIG.fcp.description,
              refId: `wv-${WEB_VITAL_CONFIG.fcp.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.fcp.name),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.lcp.name,
              longName: WEB_VITAL_CONFIG.lcp.longName,
              description: WEB_VITAL_CONFIG.lcp.description,
              refId: `wv-${WEB_VITAL_CONFIG.lcp.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.lcp.name),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.cls.name,
              longName: WEB_VITAL_CONFIG.cls.longName,
              description: WEB_VITAL_CONFIG.cls.description,
              refId: `wv-${WEB_VITAL_CONFIG.cls.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.cls.name),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.fid.name,
              longName: WEB_VITAL_CONFIG.fid.longName,
              description: WEB_VITAL_CONFIG.fid.description,
              refId: `wv-${WEB_VITAL_CONFIG.fid.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.fid.name),
          }),
          new SceneFlexItem({
            body: new WebVitalGaugeScene({
              name: WEB_VITAL_CONFIG.inp.name,
              longName: WEB_VITAL_CONFIG.inp.longName,
              description: WEB_VITAL_CONFIG.inp.description,
              refId: `wv-${WEB_VITAL_CONFIG.inp.name}`,
            }),
            $data: getQueryRunner(metrics, WEB_VITAL_CONFIG.inp.name),
          }),
        ],
      }),
    ],
  });
}
