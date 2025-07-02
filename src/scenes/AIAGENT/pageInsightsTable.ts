import { SceneDataTransformer, SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';

import { InsightsCategory,NodeData, PageInsightsIssue, PageInsightsTableRow } from './types';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

import pageInsights from './data/example-output.json';
import { INFINITY_DS_UID } from './constants';

export function groupToNestedTable(runner: SceneQueryRunner) {
  return new SceneDataTransformer({
    $data: runner,
    transformations: [
      {
        id: 'organize',
        options: {
          excludeByName: {
            success: false,
          },
          includeByName: {},
          indexByName: {
            stepIndex: 4,
            __nestedFrames: 3,
            description: 1,
            success: 2,
            title: 0,
          },
          renameByName: {
            severity: 'Severity',
            description: 'Description',
            recommendation: 'Recommendation',
            reason: 'Reason',
            url: 'URL',
          },
        },
      },
      {
        id: 'groupToNestedTable',
        options: {
          fields: {
            Severity: {
              aggregations: [],
              operation: 'groupby',
            },
          },
          showSubframeHeaders: true,
        },
      },
    ],
  });
}

function getQueryRunner(category: InsightsCategory) {
  const flattenedPageInsights: PageInsightsTableRow[] = [];
  pageInsights.nodes.forEach((node: any) => {
    const data = node.data as NodeData;
    data.page_insights.insights_by_category[category].issues.forEach((issue: PageInsightsIssue) => {
      flattenedPageInsights.push({
        url: data.url,
        severity: issue.severity,
        description: issue.description,
        reason: issue.reason,
        recommendation: issue.recommendation,
      });
    });
  });

  const runner = new SceneQueryRunner({
    datasource: {
      type: 'yesoreyeram-infinity-datasource',
      uid: INFINITY_DS_UID,
    },
    queries: [
      {
        data: JSON.stringify(flattenedPageInsights),
        format: 'table',
        parser: 'backend',
        refId: 'A',
        source: 'inline',
        type: 'json',
      },
    ],
  });

  return groupToNestedTable(runner);
}

export function getPageInsightsTable(category: string) {
  return new SceneFlexItem({
    width: '100%',
    body: new ExplorablePanel({
      pluginId: 'table',
      title: `${category} issues`,
      description: `${category} issues discovered by the AI agent`,
      $data: getQueryRunner(category.toLowerCase() as InsightsCategory),
      fieldConfig: {
        defaults: {
          color: {
            mode: 'thresholds',
          },
          custom: {
            align: 'auto',
            cellOptions: {
              type: 'auto',
            },
            inspect: true,
          },
        },
        overrides: [],
      },
      options: {
        cellHeight: 'sm',
        footer: {
          countRows: false,
          fields: '',
          reducer: ['sum'],
          show: false,
        },
        showHeader: true,
      },
    }),
  });
}
