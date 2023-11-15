import React, { useContext } from 'react';
import { PluginPage } from '@grafana/runtime';
import { useSceneApp } from '@grafana/scenes';
import { Alert } from '@grafana/ui';

import { ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import { getScriptedChecksScene } from 'scenes/Scripted/scriptedCheckScene';

export function ScriptedCheckList() {
  const navigate = useNavigation();
  const { scriptedChecks: checks } = useContext(ChecksContext);
  const { instance } = useContext(InstanceContext);

  const metricsDef = {
    uid: instance.metrics?.uid,
    type: instance.metrics?.type,
  };
  const logsDef = {
    uid: instance.logs?.uid,
    type: instance.logs?.type,
  };
  const smDef = {
    uid: instance.api?.uid,
    type: instance.api?.type,
  };

  const scene = useSceneApp(getScriptedChecksScene({ metrics: metricsDef, logs: logsDef, sm: smDef }, checks));
  if (!instance.api || !instance.metrics || !instance.logs) {
    return null;
  }
  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: 'Scripted checks' }}>
        <Alert
          severity="info"
          title="Grafana Cloud Synthetic Monitoring"
          buttonContent={<span>New Check</span>}
          onRemove={() => navigate(`${ROUTES.ScriptedChecks}/new`)}
        >
          This account does not currently have any scripted checks configured. Click the New Check button to start
          monitoring your services with Grafana Cloud, or{' '}
          <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
            check out the Synthetic Monitoring docs.
          </a>
        </Alert>
      </PluginPage>
    );
  }

  return (
    // <PluginPage pageNav={{ text: 'Scripted checks' }}>
    // <Button onClick={() => navigate(`${ROUTES.ScriptedChecks}/new`)}>Add new</Button>
    <scene.Component model={scene} />
    //   <ul>
    //     {checks.map((check, index) => {
    //       return <li key={index}>{check.job}</li>;
    //     })}
    //   </ul>
    // </PluginPage>
  );
}
