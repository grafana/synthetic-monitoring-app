import { Spinner } from '@grafana/ui';
import { ChecksContextProvider } from 'components/ChecksContextProvider';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import React, { useContext, useMemo } from 'react';
import { getDashboardSceneApp } from 'scenes/dashboardSceneApp';
import { FeatureName } from 'types';

export function DashboardPage() {
  const { instance } = useContext(InstanceContext);
  const { isEnabled } = useFeatureFlag(FeatureName.Scenes);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);

  const navigate = useNavigation();

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
    return getDashboardSceneApp({ metrics: metricsDef, logs: logsDef, sm: smDef }, multiHttpEnabled);
  }, [instance.api, instance.logs, instance.metrics, multiHttpEnabled]);

  if (!isEnabled) {
    navigate('redirect?dashboard=summary');
    return null;
  }
  if (!scene) {
    return <Spinner />;
  }

  return (
    <ChecksContextProvider>
      <scene.Component model={scene} />
    </ChecksContextProvider>
  );
}
