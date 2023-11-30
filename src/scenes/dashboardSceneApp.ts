import { SceneApp, SceneAppPage } from '@grafana/scenes';

import { Check, CheckType, DashboardSceneAppConfig, ROUTES } from 'types';
import { checkType } from 'utils';
import { PLUGIN_URL_PATH } from 'components/constants';

import { getPingScene } from './PING/pingScene';
import { getTcpScene } from './TCP/getTcpScene';
import { getTracerouteScene } from './Traceroute/getTracerouteScene';
import { getDNSScene } from './DNS';
import { getHTTPScene } from './HTTP';
import { getMultiHttpScene } from './MULTIHTTP';
import { getScriptedScene } from './SCRIPTED';
import { getSummaryScene } from './Summary';

export function getDashboardSceneApp(
  config: DashboardSceneAppConfig,
  includeMultiHttp = false,
  includek6 = false,
  checks: Check[]
) {
  const { http, ping, dns, tcp, traceroute, multihttp, k6 } = checks.reduce<Record<CheckType, Check[]>>(
    (acc, check) => {
      const type = checkType(check.settings);
      if (check.enabled) {
        acc[type].push(check);
      }
      return acc;
    },
    {
      [CheckType.HTTP]: [],
      [CheckType.PING]: [],
      [CheckType.DNS]: [],
      [CheckType.TCP]: [],
      [CheckType.Traceroute]: [],
      [CheckType.MULTI_HTTP]: [],
      [CheckType.K6]: [],
    }
  );
  const tabs = [
    new SceneAppPage({
      title: 'Summary',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}`,
      getScene: getSummaryScene(config, checks),
    }),
    new SceneAppPage({
      title: 'HTTP',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/http`,
      getScene: getHTTPScene(config, http),
    }),

    new SceneAppPage({
      title: 'PING',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/ping`,
      getScene: getPingScene(config, ping),
    }),
    new SceneAppPage({
      title: 'DNS',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/dns`,
      getScene: getDNSScene(config, dns),
    }),
    new SceneAppPage({
      title: 'TCP',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/tcp`,
      getScene: getTcpScene(config, tcp),
    }),
    new SceneAppPage({
      title: 'TRACEROUTE',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/traceroute`,
      getScene: getTracerouteScene(config, traceroute),
    }),
  ];

  if (includeMultiHttp) {
    const appPage = new SceneAppPage({
      title: 'MULTIHTTP',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/multihttp`,
      getScene: getMultiHttpScene(config, multihttp),
    });
    tabs.splice(2, 0, appPage);
  }

  if (includek6) {
    const appPage = new SceneAppPage({
      title: 'SCRIPTED',
      url: `${PLUGIN_URL_PATH}${ROUTES.Scene}/k6`,
      getScene: getScriptedScene(config, k6),
    });
    tabs.push(appPage);
  }

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Dashboards',
        url: `${PLUGIN_URL_PATH}${ROUTES.Scene}`,
        hideFromBreadcrumbs: true,
        getScene: getSummaryScene(config, checks),
        tabs,
      }),
    ],
  });
}
