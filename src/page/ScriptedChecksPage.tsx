import React, { useContext, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { LoadingPlaceholder, useTheme2 } from '@grafana/ui';

import { ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { PLUGIN_URL_PATH } from 'components/constants';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { ScriptedCheckCodeEditor, ScriptedFormValues } from 'components/ScriptedCheckCodeEditor';
import { ScriptedCheckList } from 'components/ScriptedCheckList';
import { ScriptedCheckScene } from 'scenes/Scripted/ScriptedCheckScene';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}/new` };

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const [saving, setSaving] = useState(false);
  const { instance } = useContext(InstanceContext);
  const { loading, scriptedChecks } = useContext(ChecksContext);
  const handleSubmit = async (
    { name, target, script, frequency, timeout, ...rest }: ScriptedFormValues,
    errors: any
  ) => {
    setSaving(true);
    // if (errors) {
    //   console.error(errors);
    //   return;
    // }
    // try {
    const check = {
      ...rest,
      job: name,
      target,
      frequency: frequency * 1000,
      timeout: timeout * 1000,
      labels: [],
      basicMetricsOnly: true,
      alertSensitivity: '',
      settings: {
        k6: {
          script: btoa(script),
        },
      },
    };
    return instance.api?.addCheck(check).finally(() => setSaving(false));
  };

  const { path } = useRouteMatch();

  if (loading) {
    return <LoadingPlaceholder text={undefined} />;
  }

  return (
    <Switch>
      <Route path={`${path}/new`} exact>
        <NewScriptedCheck />
      </Route>
      <Route path={`${path}/new/builder`}>
        <PluginPage
          pageNav={{
            text: 'Test builder',
            parentItem: newCheckParent,
          }}
        >
          <SyntheticsBuilder theme={theme} onSubmit={handleSubmit} saving={saving} />
        </PluginPage>
      </Route>
      <Route path={`${path}/new/script-editor`}>
        <PluginPage
          pageNav={{
            text: 'Script editor',
            parentItem: newCheckParent,
          }}
        >
          <ScriptedCheckCodeEditor onSubmit={handleSubmit} saving={saving} />
        </PluginPage>
      </Route>
      <Route path={path}>
        <ScriptedCheckScene />
      </Route>
    </Switch>
  );
}
