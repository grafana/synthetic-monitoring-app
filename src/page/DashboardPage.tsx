import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { CustomVariable, QueryVariable, SceneContextProvider } from '@grafana/scenes-react';
import { VariableHide, VariableRefresh } from '@grafana/schema';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType, DashboardSceneAppConfig } from 'types';
import { getCheckType } from 'utils';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { getBrowserScene } from 'scenes/BROWSER/browserScene';
import { getDNSScene } from 'scenes/DNS';
import { getGRPCScene } from 'scenes/GRPC/getGRPCScene';
import { getHTTPScene } from 'scenes/HTTP';
import { HttpDashboard } from 'scenes/HTTP/scenesReact/HttpDashboard';
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
    const url = generateRoutePath(ROUTES.CheckDashboard, { id: check.id! });
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
      case CheckType.HTTP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getHTTPScene(config, check),
            }),
          ],
        });
      }
      case CheckType.Browser:
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getBrowserScene(config, check, checkType),
            }),
          ],
        });
      // fallthrough
      case CheckType.Scripted:
      case CheckType.MULTI_HTTP: {
        return new SceneApp({
          pages: [
            new SceneAppPage({
              title: check.job,
              url,
              getScene: getScriptedScene(config, check, checkType),
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
    }
  }, [smDS, metricsDS, logsDS, check]);

  if (!isLoading && !check) {
    return <CheckNotFound />;
  }

  if (!scene) {
    return <Spinner />;
  }

  if (check && getCheckType(check.settings) === CheckType.HTTP) {
    return (
      <>
        <SceneContextProvider timeRange={{ from: 'now-1h', to: 'now' }} withQueryController>
          <QueryVariable
            name="probe"
            isMulti={true}
            query={{ query: `label_values(sm_check_info{check_name="${CheckType.HTTP}"},probe)`, refId: 'A' }}
            refresh={VariableRefresh.onDashboardLoad}
            datasource={{ uid: metricsDS?.uid }}
            regex={'.*'}
            includeAll={true}
            initialValue={'all'}
          >
            <CustomVariable
              name="job"
              query={check.job}
              initialValue={check.job}
              label={check.job}
              hide={VariableHide.hideVariable}
            >
              <CustomVariable
                name="instance"
                query={check.target}
                initialValue={check.target}
                label={check.target}
                hide={VariableHide.hideVariable}
              >
                <HttpDashboard check={check} />
              </CustomVariable>
            </CustomVariable>
          </QueryVariable>
        </SceneContextProvider>
      </>
    );
  }

  return <scene.Component model={scene} />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
