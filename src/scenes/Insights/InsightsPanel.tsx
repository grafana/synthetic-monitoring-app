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
import { getInsightsItem } from './InsightsItem';
import { DataSourceRef } from '@grafana/schema';
import { getInsightsMetric } from './insightsMetrics';

interface InsightsState extends SceneObjectState {
  audits: Array<{ id: string; title: string; description: string; link?: string; linkText?: string }>;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

export class Insights extends SceneObjectBase<InsightsState> {
  public static Component = InsightsRenderer;

  public constructor() {
    super({
      audits: [],
    });

    this.initializeFakeInsights();
  }

  private initializeFakeInsights() {
    const fakeInsights: Insight[] = [
      {
        id: 'high-cardinality',
        title: 'High metric cardinality',
        description:
            'Our algorithms have detected high metric cardinality, meaning your test is generating an excessive number of unique values for tags.',
        link: 'https://grafana.com/docs/k6/latest/using-k6/http-requests/#url-grouping',
        linkText: 'Learn more about URL grouping',
      },
      {
        id: 'average-latency-increased-last-month',
        title: 'Average Latency: Increased by 20%',
        description: 'The average latency of the Checks increased by 20% over the last month.',
      },
      {
        id: 'probe-latency-increased-last-week',
        title: 'Probe Latency: Increased by 10%',
        description: 'The average latency of the Probe in Atlanta increased by 10% over the last month.',
      },
    ];

    this.setState({ audits: fakeInsights });
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

function getHighCardinalityInsightsItem(title: string, description: string, link: string, linkText: string) {
  return new SceneFlexItem({
    height: 200,
    body: getInsightsItem(title, description, link, linkText),
  });
}

function getAverageLatencyLastMonthItem(metrics: DataSourceRef, title: string, description: string) {
  return new SceneFlexItem({
    width: 650,
    height: 200,
    body: getInsightsMetric(
        metrics,
        title,
        description,
        [
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
        ]
    ),
  });
}

function getProbeLatencyLastMonthItem(metrics: DataSourceRef, title: string, description: string) {
  return new SceneFlexItem({
    width: 650,
    height: 200,
    body: getInsightsMetric(
        metrics,
        title,
        description,
        [
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
        ]
    ),
  });
}

export function getInsightsPanel(metrics: DataSourceRef) {
  const insights = new Insights();
  const audits = insights.state.audits; // Accessing the state of the Insights component directly

  const insightsItems = audits.map((insight) => {
    if (insight.id === 'high-cardinality') {
      return getHighCardinalityInsightsItem(
          insight.title,
          insight.description,
          insight.link!,
          insight.linkText!
      );
    }
    if (insight.id === 'average-latency-increased-last-month') {
      return getAverageLatencyLastMonthItem(metrics, insight.title, insight.description);
    }
    if (insight.id === 'probe-latency-increased-last-week') {
      return getProbeLatencyLastMonthItem(metrics, insight.title, insight.description);
    }
    return null;
  }).filter(Boolean) as SceneFlexItem[];

  return new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        body: insights,
      }),
      new SceneFlexLayout({
        direction: 'row',
        children: insightsItems,
      }),
    ],
  });
}
