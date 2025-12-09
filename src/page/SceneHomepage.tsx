import React, { useMemo } from 'react';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { LoadingPlaceholder } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';

import { DashboardSceneAppConfig } from 'types';
import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { useSuspenseChecks } from 'data/useChecks';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { PageNavigation } from 'components/PageNavigation/PageNavigation';
import { getSummaryScene } from 'scenes/Summary';

function SceneHomepageComponent() {
  const smDS = useSMDS();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const { data: checks = [], isLoading } = useSuspenseChecks();

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
          title: 'Synthetics',
          renderTitle: () => null, // Title is rendered by PluginPage instead
          url: `${PLUGIN_URL_PATH}${AppRoutes.Home}`,
          hideFromBreadcrumbs: false,
          getScene: getSummaryScene(config, checks, true),
        }),
      ],
    });
  }, [metricsDS, logsDS, smDS, checks]);

  if (!scene || isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return (
    <PluginPage renderTitle={() => <h1>Home</h1>}>
      <PageNavigation />
      <scene.Component model={scene} />
    </PluginPage>
  );
}

export function SceneHomepage() {
  return (
    <QueryErrorBoundary>
      <SceneHomepageComponent />
    </QueryErrorBoundary>
  );
}
