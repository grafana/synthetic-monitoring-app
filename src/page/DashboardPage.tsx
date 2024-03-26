import React, { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType, DashboardSceneAppConfig, FeatureName } from 'types';
import { checkType as getCheckType } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import { PLUGIN_URL_PATH } from 'components/constants';
import { getDashboardSceneApp } from 'scenes/dashboardSceneApp';
import { getDNSScene } from 'scenes/DNS';
import { getHTTPScene } from 'scenes/HTTP';
import { getPingScene } from 'scenes/PING/pingScene';
import { getScriptedScene } from 'scenes/SCRIPTED';
import { getTcpScene } from 'scenes/TCP/getTcpScene';
import { getTracerouteScene } from 'scenes/Traceroute/getTracerouteScene';

function DashboardPageContent() {
  console.log('what about here?');
  const { instance } = useContext(InstanceContext);
  const { isEnabled } = useFeatureFlag(FeatureName.Scenes);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const { isEnabled: scriptedEnabled } = useFeatureFlag(FeatureName.ScriptedChecks);
  const { data: checks = [], isLoading } = useChecks();
  const { isEnabled: perCheckDashboardsEnabled } = useFeatureFlag(FeatureName.PerCheckDashboards);
  const { id } = useParams<CheckPageParams>();

  const navigate = useNavigation();
  const checkToView = checks.find((check) => String(check.id) === id);

  const scene = useMemo(() => {
    if (!instance.api || !instance.metrics || !instance.logs) {
      return;
    }
    const metricsDef = {
      uid: instance.metrics.uid,
      type: instance.metrics.type,
    };
    const logsDef = {
      uid: instance.logs.uid,
      type: instance.logs.type,
    };
    const smDef = {
      uid: instance.api.uid,
      type: instance.api.type,
    };
    const config: DashboardSceneAppConfig = { metrics: metricsDef, logs: logsDef, sm: smDef, singleCheckMode: false };
    if (!perCheckDashboardsEnabled) {
      return getDashboardSceneApp(config, multiHttpEnabled, scriptedEnabled, checks);
    }
    config.singleCheckMode = true;
    if (!checkToView) {
      return null;
    }
    const checkType = getCheckType(checkToView.settings);
    const url = `${PLUGIN_URL_PATH}checks/${checkToView.id}/dashboard`;
    switch (checkType) {
      case CheckType.DNS: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getDNSScene(config, [checkToView]),
            }),
          ],
        });
      }
      case CheckType.HTTP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getHTTPScene(config, [checkToView]),
            }),
          ],
        });
      }
      case CheckType.Scripted:
      case CheckType.MULTI_HTTP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getScriptedScene(config, [checkToView], checkType),
            }),
          ],
        });
      }
      case CheckType.PING: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getPingScene(config, [checkToView]),
            }),
          ],
        });
      }
      case CheckType.TCP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getTcpScene(config, [checkToView]),
            }),
          ],
        });
      }
      case CheckType.Traceroute: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getTracerouteScene(config, [checkToView]),
            }),
          ],
        });
      }
      case CheckType.GRPC: {
        return null;
      }
    }
  }, [
    instance.api,
    instance.logs,
    instance.metrics,
    multiHttpEnabled,
    scriptedEnabled,
    checks,
    perCheckDashboardsEnabled,
    checkToView,
  ]);

  if (!isEnabled) {
    navigate('redirect?dashboard=summary');
    return null;
  }
  if (!scene || isLoading) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
