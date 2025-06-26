import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType, DashboardSceneAppConfig } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { BrowserDashboard } from 'scenes/Browser/BrowserDashboard';
import { getDNSScene } from 'scenes/DNS';
import { getGRPCScene } from 'scenes/GRPC/getGRPCScene';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';
import { getPingScene } from 'scenes/PING/pingScene';
import { ScriptedDashboard } from 'scenes/Scripted/ScriptedDashboard';
import { getTcpScene } from 'scenes/TCP/getTcpScene';
import { getTracerouteScene } from 'scenes/Traceroute/getTracerouteScene';

import { CheckNotFound } from './NotFound/CheckNotFound';

function DashboardPageContent() {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const { data: checks = [], isLoading } = useChecks();
  const { id } = useParams<CheckPageParams>();
  const check = checks.find((check) => String(check.id) === id);

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

    const config: DashboardSceneAppConfig = { metrics: metricsDef, logs: logsDef, sm: smDef };

    if (!check) {
      return null;
    }

    const checkType = getCheckType(check.settings);
    const url = generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! });
    switch (checkType) {
      case CheckType.DNS: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getDNSScene(config, check),
            }),
          ],
        });
      }
      case CheckType.PING: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getPingScene(config, check),
            }),
          ],
        });
      }
      case CheckType.TCP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getTcpScene(config, check),
            }),
          ],
        });
      }
      case CheckType.Traceroute: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getTracerouteScene(config, check),
            }),
          ],
        });
      }

      case CheckType.GRPC: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getGRPCScene(config, check),
            }),
          ],
        });
      }

      case CheckType.Browser:
      case CheckType.MULTI_HTTP:
      case CheckType.Scripted:
      case CheckType.HTTP: {
        return null;
      }
    }
  }, [smDS, metricsDS, logsDS, check]);

  if (!isLoading && !check) {
    return <CheckNotFound />;
  }

  if (check && getCheckType(check.settings) === CheckType.HTTP) {
    return <HttpDashboard check={check} />;
  }

  if (
    check &&
    (getCheckType(check.settings) === CheckType.Scripted || getCheckType(check.settings) === CheckType.MULTI_HTTP)
  ) {
    return <ScriptedDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Browser) {
    return <BrowserDashboard check={check} />;
  }

  if (scene) {
    return <scene.Component model={scene} />;
  }

  return <Spinner />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
