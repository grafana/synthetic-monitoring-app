import React, { useContext, useMemo } from 'react';
import { SceneApp, SceneAppPage } from '@grafana/scenes';
import { LoadingPlaceholder } from '@grafana/ui';

import { DashboardSceneAppConfig, ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';
import { getSummaryScene } from 'scenes/Summary';

export const SceneHomepage = () => {
  const { instance } = useContext(InstanceContext);
  const { data: checks = [], isLoading } = useChecks();

  const scene = useMemo(() => {
    const config: DashboardSceneAppConfig = {
      metrics: {
        uid: instance.metrics?.uid,
      },
      logs: { uid: instance.logs?.uid },
      sm: { uid: instance.api?.uid },
      singleCheckMode: true,
    };

    return new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Home',
          url: `${PLUGIN_URL_PATH}${ROUTES.Home}`,
          hideFromBreadcrumbs: true,
          getScene: getSummaryScene(config, checks, true),
        }),
      ],
    });
  }, [instance.metrics?.uid, instance.logs?.uid, instance.api?.uid, checks]);

  if (!scene || isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  return <scene.Component model={scene} />;
};
