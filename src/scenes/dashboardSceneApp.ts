import {
  CustomVariable,
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
  VizPanel,
} from '@grafana/scenes';
import { PLUGIN_URL_PATH } from 'components/constants';
import { DashboardSceneAppConfig, ROUTES } from 'types';
import { getSummaryScene } from './Summary';

function getTab1Scene() {
  return getBasicScene(false, '__server_names');
}

function getBasicScene(templatised = true, seriesToShow = '__server_names') {
  const timeRange = new SceneTimeRange({
    from: 'now-6h',
    to: 'now',
  });

  // Variable definition
  const customVariable = new CustomVariable({
    name: 'seriesToShow',
    label: 'Series to show',
    value: '__server_names',
    query: 'Server Names : __server_names, House locations : __house_locations',
  });

  // Query runner definition
  const queryRunner = new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk',
        seriesCount: 5,
        // Query is using variable value
        alias: templatised ? '${seriesToShow}' : seriesToShow,
        min: 30,
        max: 60,
      },
    ],
    maxDataPoints: 100,
  });

  //  // Custom object definition
  //  const customObject = new CustomSceneObject({
  //   value: '5',
  //   onChange: (newValue) => {
  //     queryRunner.setState({
  //       queries: [
  //         {
  //           ...queryRunner.state.queries[0],
  //           seriesCount: newValue,
  //         },
  //       ],
  //     });
  //     queryRunner.runQueries();
  //   },
  // });

  return new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({ variables: templatised ? [customVariable] : [] }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new VizPanel({
          pluginId: 'timeseries',
          // Title is using variable value
          title: templatised ? '${seriesToShow}' : seriesToShow,
        }),
      ],
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      // customObject,
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({
        intervals: ['5s', '1m', '1h'],
        isOnCanvas: true,
      }),
    ],
  });
}

export const DATASOURCE_REF = {
  uid: 'scenes-app-testdata',
  type: 'testdata',
};

export function getDashboardSceneApp(config: DashboardSceneAppConfig) {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Page with tabs',
        subTitle: 'This scene showcases a basic tabs functionality.',
        // Important: Mind the page route is ambiguous for the tabs to work properly
        url: `${PLUGIN_URL_PATH}${ROUTES.Scene}`,
        hideFromBreadcrumbs: false,
        getScene: getSummaryScene(config),
        tabs: [
          new SceneAppPage({
            title: 'Summary',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}`,
            getScene: getSummaryScene(config),
          }),
          new SceneAppPage({
            title: 'HTTP',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/http`,
            getScene: getTab1Scene,
          }),
          new SceneAppPage({
            title: 'DNS',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/tab-two`,
            getScene: getTab1Scene,
          }),
        ],
      }),
    ],
  });
}
