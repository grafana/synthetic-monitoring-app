import React, { useContext } from 'react';
import { useSceneApp } from '@grafana/scenes';

import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';

import { getScriptedChecksScene } from './getScriptedCheckScene';

export function ScriptedCheckScene() {
  const { instance } = useContext(InstanceContext);
  const { scriptedChecks: checks } = useContext(ChecksContext);
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

  const scene = useSceneApp(() => getScriptedChecksScene({ metrics: metricsDef, logs: logsDef, sm: smDef }, checks));

  return <scene.Component model={scene} />;
}
