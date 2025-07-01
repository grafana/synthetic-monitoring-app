import { SceneDataTransformer, SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { MappingType } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';
import userJourneys from './data/user-journeys.json';
import { UserJourney, UserJourneyStep, UserJourneyTableRow } from './types';
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
            description: 'Description',
            success: 'Is successful?',
            title: 'Title',
            reasoning: 'Reasoning',
            url: 'URL',
            stepIndex: 'Step #',
          },
        },
      },
      {
        id: 'groupToNestedTable',
        options: {
          fields: {
            Description: {
              aggregations: [],
              operation: 'groupby',
            },
            'Is successful?': {
              aggregations: [],
              operation: 'groupby',
            },
            Title: {
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

function getQueryRunner() {
  const flattenedUserJourneys: UserJourneyTableRow[] = [];
  userJourneys.forEach((journey: UserJourney) => {
    journey.steps.forEach((step: UserJourneyStep, index: number) => {
      flattenedUserJourneys.push({
        stepIndex: index + 1,
        description: journey.description,
        success: journey.success,
        title: journey.title,
        url: step.url,
        reasoning: step.reasoning,
      });
    });
  });
  console.log('Flattened user journeys:', flattenedUserJourneys);

  const runner = new SceneQueryRunner({
    datasource: {
      type: 'yesoreyeram-infinity-datasource',
      uid: INFINITY_DS_UID,
    },
    queries: [
      {
        data: JSON.stringify(flattenedUserJourneys),
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

export function getUserJourneysTable() {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      pluginId: 'table',
      title: 'User journeys',
      description: 'User journeys discovered and analyzed by the AI agent',
      $data: getQueryRunner(),
      fieldConfig: {
        defaults: {
          color: {
            mode: 'thresholds',
          },
          custom: {
            align: 'auto',
            cellOptions: {
              type: 'auto',
              wrapText: true,
            },
            inspect: false,
          },
          mappings: [
            {
              options: {
                false: {
                  index: 1,
                  text: 'https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/274c.png',
                },
                true: {
                  index: 0,
                  text: 'https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/2705.png',
                },
              },
              type: MappingType.ValueToText,
            },
          ],
        },
        overrides: [
          {
            matcher: {
              id: 'byName',
              options: 'success',
            },
            properties: [
              {
                id: 'custom.cellOptions',
                value: {
                  type: 'image',
                },
              },
              {
                id: 'custom.width',
                value: 150,
              },
            ],
          },
          {
            matcher: {
              id: 'byName',
              options: 'Reasoning',
            },
            properties: [
              {
                id: 'custom.cellOptions',
                value: {
                  type: 'auto',
                  wrapText: true,
                },
              },
            ],
          },
        ],
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
