import React, { useContext, useMemo } from 'react';
import { Spinner } from '@grafana/ui';

import { FeatureName } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { ChecksContextProvider } from 'components/ChecksContextProvider';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import { getDashboardSceneApp } from 'scenes/dashboardSceneApp';

function DashboardPageContent() {
  const { instance } = useContext(InstanceContext);
  const { isEnabled } = useFeatureFlag(FeatureName.Scenes);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const { checks, loading } = useContext(ChecksContext);

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
    return getDashboardSceneApp({ metrics: metricsDef, logs: logsDef, sm: smDef }, multiHttpEnabled, checks);
  }, [instance.api, instance.logs, instance.metrics, multiHttpEnabled, checks]);

  if (!isEnabled) {
    navigate('redirect?dashboard=summary');
    return null;
  }
  if (!scene || loading) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}

export function DashboardPage() {
  return (
    <ChecksContextProvider>
      <DashboardPageContent />
    </ChecksContextProvider>
  );
}
