import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { PLUGIN_URL_PATH } from 'components/constants';
import { DashboardSceneAppConfig, ROUTES } from 'types';
import { getDNSScene } from './DNS';
import { getHTTPScene } from './HTTP';
import { getSummaryScene } from './Summary';

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
            getScene: getHTTPScene(config),
          }),
          new SceneAppPage({
            title: 'DNS',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/dns`,
            getScene: getDNSScene(config),
          }),
          // new SceneAppPage({
          //   title: 'DNS',
          //   url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/tab-two`,
          //   getScene: getTab1Scene,
          // }),
        ],
      }),
    ],
  });
}
