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
import { BrowserDashboard } from 'scenes/BrowserDashboard/BrowserDashboard';
import { DNSDashboard } from 'scenes/DNS/DnsDashboard';
import { getGRPCScene } from 'scenes/GRPC/getGRPCScene';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';
import { PingDashboard } from 'scenes/PING/PingDashboard';
import { ScriptedDashboard } from 'scenes/Scripted/ScriptedDashboard';
import { TcpDashboard } from 'scenes/TCP/TcpDashboard';
import { TracerouteDashboard } from 'scenes/Traceroute/TracerouteDashboard';

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

      case CheckType.Traceroute:
      case CheckType.DNS:
      case CheckType.TCP:
      case CheckType.PING:
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

  if (check && getCheckType(check.settings) === CheckType.TCP) {
    return <TcpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.DNS) {
    return <DNSDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.PING) {
    return <PingDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.HTTP) {
    return <HttpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Traceroute) {
    return <TracerouteDashboard check={check} />;
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
