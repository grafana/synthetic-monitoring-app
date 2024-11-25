import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType, DashboardSceneAppConfig, FeatureName, ROUTES } from 'types';
import { getCheckType } from 'utils';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { getBrowserScene } from 'scenes/BROWSER/browserScene';
import { getDNSScene } from 'scenes/DNS';
import { getGRPCScene } from 'scenes/GRPC/getGRPCScene';
import { getHTTPScene } from 'scenes/HTTP';
import { getPingScene } from 'scenes/PING/pingScene';
import { getScriptedScene } from 'scenes/SCRIPTED';
import { getTcpScene } from 'scenes/TCP/getTcpScene';
import { getTracerouteScene } from 'scenes/Traceroute/getTracerouteScene';

import { CheckNotFound } from './NotFound/CheckNotFound';

function DashboardPageContent() {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const { data: checks = [], isLoading } = useChecks();
  const { id } = useParams<CheckPageParams>();

  const checkToView = checks.find((check) => String(check.id) === id);

  const newUptimeQuery = useFeatureFlag(FeatureName.UptimeQueryV2)?.isEnabled;

  const scene = useMemo(() => {
    const metricsDef = {
      uid: metricsDS?.uid,
      type: metricsDS?.type,
    };
    const logsDef = {
      uid: logsDS?.uid,
      type: logsDS?.type,
    };
    const smDef = {
      uid: smDS.uid,
      type: smDS.type,
    };

    const config: DashboardSceneAppConfig = { metrics: metricsDef, logs: logsDef, sm: smDef, singleCheckMode: false };
    config.singleCheckMode = true;
    if (!checkToView) {
      return null;
    }

    const checkType = getCheckType(checkToView.settings);
    const url = generateRoutePath(ROUTES.CheckDashboard, { id: checkToView.id! });
    switch (checkType) {
      case CheckType.DNS: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getDNSScene(config, [checkToView], newUptimeQuery),
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
              getScene: getHTTPScene(config, [checkToView], newUptimeQuery),
            }),
          ],
        });
      }
      case CheckType.Browser:
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getBrowserScene(config, [checkToView], checkType, newUptimeQuery),
            }),
          ],
        });
      // fallthrough
      case CheckType.Scripted:
      case CheckType.MULTI_HTTP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: checkToView.job,
              url,
              getScene: getScriptedScene(config, [checkToView], checkType, newUptimeQuery),
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
              getScene: getPingScene(config, [checkToView], newUptimeQuery),
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
              getScene: getTcpScene(config, [checkToView], newUptimeQuery),
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
              getScene: getGRPCScene(config, [checkToView], newUptimeQuery),
            }),
          ],
        });
      }
    }
  }, [smDS, metricsDS, logsDS, checkToView, newUptimeQuery]);

  if (!isLoading && !checkToView) {
    return <CheckNotFound />;
  }

  if (!scene) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
