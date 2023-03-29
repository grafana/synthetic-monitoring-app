import { Spinner } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext } from 'react';
import { getDashboardSceneApp } from 'scenes/dashboardSceneApp';

export function DashboardPage() {
  const { instance } = useContext(InstanceContext);
  if (!instance.metrics || !instance.logs || !instance.api) {
    return <Spinner />;
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
  const scene = getDashboardSceneApp({ metrics: metricsDef, logs: logsDef, sm: smDef });
  return <scene.Component model={scene} />;
}
