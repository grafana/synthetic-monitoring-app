import React, { useContext, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';

import { ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { PLUGIN_URL_PATH } from 'components/constants';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { ScriptedCheckCodeEditor, ScriptedFormValues } from 'components/ScriptedCheckCodeEditor';
import { ScriptedCheckList } from 'components/ScriptedCheckList';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}/new` };

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const [saving, setSaving] = useState(false);
  const { instance } = useContext(InstanceContext);
  const handleSubmit = async (
    { name, target, script, frequency, timeout, ...rest }: ScriptedFormValues,
    errors: any
  ) => {
    setSaving(true);
    if (errors) {
      console.error(errors);
      return;
    }
    try {
      const check = {
        ...rest,
        job: name,
        target,
        frequency: frequency * 1000,
        timeout: timeout * 1000,
        enabled: false,
        labels: [],
        basicMetricsOnly: true,
        alertSensitivity: '',
        settings: {
          k6: {
            script: btoa(script),
          },
        },
      };
      const resp = await instance.api?.addCheck(check);
      console.log({ resp });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const { path } = useRouteMatch();

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
        <ScriptedCheckList />
      </Route>
    </Switch>
  );
}
