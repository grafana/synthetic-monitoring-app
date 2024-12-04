import React from 'react';
import { useStyles2 } from '@grafana/ui';
import {
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { getInsightsPanelStyles } from './getInsightsPanelStyles';
import {getInsightsItem} from "./InsightsItem";
import {DataSourceRef} from "@grafana/schema";
import {getInsightsMetric} from "./insightsMetrics";

interface InsightsState extends SceneObjectState {
  insights: Array<{ title: string; description: string; link?: string; linkText?: string }>;
}

interface Insight {
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

export class Insights extends SceneObjectBase<InsightsState> {
  public static Component = InsightsRenderer;

  public constructor() {
    super({
      insights: [],
    });

    this.initializeFakeInsights();
  }

  private initializeFakeInsights() {
    const fakeInsights: Insight[] = [
      { title: 'High metric cardinality', description: 'Our algorithms have detected high metric cardinality, meaning your test is generating an excessive number of unique values for tags.', link: 'https://grafana.com/docs/k6/latest/using-k6/http-requests/#url-grouping', linkText: 'Learn more about URL grouping' },
      { title: 'Increment in Average Latency', description: 'The average latency of the Checks increased by 20% over the last month.' },
      { title: 'Increment in Probe Latency', description: 'The average latency of the Probe in Atlanta increased by 10% over the last month.' },
    ];

    this.setState({ insights: fakeInsights });
  }
}

function InsightsRenderer({ model }: SceneComponentProps<Insights>) {
  const styles = useStyles2(getInsightsPanelStyles);

  return (
      <div>
        <div className={styles.headerContainer}>
          <h6 title="Insights" className={styles.title}>
            Insights
          </h6>
        </div>
      </div>
  );
}

export function getInsightsPanel(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: new Insights(),
      }),
      new SceneFlexLayout({
        direction: 'row',
        children: [
          new SceneFlexItem({
            height: 200,
            body: getInsightsItem('High metric cardinality', 'Our algorithms have detected high metric cardinality, meaning your test is generating an excessive number of unique values for tags.', 'https://grafana.com/docs/k6/latest/using-k6/http-requests/#url-grouping', 'Learn more about URL grouping'),
          }),
          new SceneFlexItem({
            width: 650,
            height: 200,
            body: getInsightsMetric(metrics, 'Average Latency: Increased by 20%', 'The average latency of the Checks increased by 20% over the last month.', [
              {
                expr: `sum by (job) (probe_http_total_duration_seconds{job=~".*"})`,
                refId: 'A',
                legendFormat: '{{probe}}',
              },
              {
                expr: `sum by (job) (probe_http_total_duration_seconds{job=~".*"} offset 30d)`,
                refId: 'B',
                legendFormat: '{{job}} - 30d',
              },
            ]),
          }),
          new SceneFlexItem({
            width: 650,
            height: 200,
            body: getInsightsMetric(metrics, 'Probe Latency: Increased by 10%', 'The average latency of the Probe in Atlanta increased by 10% over the last week.', [
              {
                expr: `sum by (probe) (probe_http_total_duration_seconds{probe=~".*"})`,
                refId: 'A',
                legendFormat: '{{probe}}',
              },
              {
                expr: `sum by (probe) (probe_http_total_duration_seconds{probe=~".*"} offset 7d)`,
                refId: 'B',
                legendFormat: '{{probe}} - 7d',
              },
            ]),
          }),
        ],
      }),
    ],
  });
}
