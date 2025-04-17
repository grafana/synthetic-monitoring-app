import React, { useMemo } from 'react';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { LoadingPlaceholder } from '@grafana/ui';

import { DashboardSceneAppConfig } from 'types';
import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { useChecks } from 'data/useChecks';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { getSummaryScene } from 'scenes/Summary';

export const SceneHomepage = () => {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const { data: checks = [], isLoading } = useChecks();

  const scene = useMemo(() => {
    const config: DashboardSceneAppConfig = {
      metrics: {
        uid: metricsDS?.uid,
      },
      logs: { uid: logsDS?.uid },
      sm: { uid: smDS.uid },
    };

    return new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Home',
          url: `${PLUGIN_URL_PATH}${AppRoutes.Home}`,
          hideFromBreadcrumbs: true,
          getScene: getSummaryScene(config, checks, true),
        }),
      ],
    });
  }, [metricsDS, logsDS, smDS, checks]);

  if (!scene || isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return <scene.Component model={scene} />;
};
