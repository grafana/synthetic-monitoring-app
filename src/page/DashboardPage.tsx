import React, { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType, DashboardSceneAppConfig } from 'types';
import { getCheckType } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';
import { getDNSScene } from 'scenes/DNS';
import { getGRPCScene } from 'scenes/GRPC/getGRPCScene';
import { getHTTPScene } from 'scenes/HTTP';
import { getPingScene } from 'scenes/PING/pingScene';
import { getScriptedScene } from 'scenes/SCRIPTED';
import { getTcpScene } from 'scenes/TCP/getTcpScene';
import { getTracerouteScene } from 'scenes/Traceroute/getTracerouteScene';

function DashboardPageContent() {
  const { instance } = useContext(InstanceContext);
  const { data: checks = [], isLoading } = useChecks();
  const { id } = useParams<CheckPageParams>();

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
      case CheckType.Browser:
      // @todo: add browser scene
      // fallthrough
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
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getGRPCScene(config, [checkToView]),
            }),
          ],
        });
      }
    }
  }, [instance.api, instance.logs, instance.metrics, checkToView]);

  if (!scene || isLoading) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
