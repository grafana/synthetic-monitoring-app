import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { PLUGIN_URL_PATH } from 'components/constants';
import { DashboardSceneAppConfig, ROUTES } from 'types';
import { getDNSScene } from './DNS';
import { getHTTPScene } from './HTTP';
import { getPingScene } from './PING/pingScene';
import { getSummaryScene } from './Summary';
import { getTcpScene } from './TCP/getTcpScene';
import { getTracerouteScene } from './Traceroute/getTracerouteScene';

export function getDashboardSceneApp(config: DashboardSceneAppConfig) {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Dashboards',
        subTitle: 'Check results',
        url: `${PLUGIN_URL_PATH}${ROUTES.Scene}`,
        hideFromBreadcrumbs: true,
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
            title: 'PING',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/ping`,
            getScene: getPingScene(config),
          }),
          new SceneAppPage({
            title: 'DNS',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/dns`,
            getScene: getDNSScene(config),
          }),
          new SceneAppPage({
            title: 'TCP',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/tcp`,
            getScene: getTcpScene(config),
          }),
          new SceneAppPage({
            title: 'Traceroute',
            url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/traceroute`,
            getScene: getTracerouteScene(config),
          }),
        ],
      }),
    ],
  });
}
