import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { ScriptedCheckCodeEditor } from 'components/ScriptedCheckCodeEditor';
import { ScriptedCheckList } from 'components/ScriptedCheckList';
import { PLUGIN_URL_PATH } from 'components/constants';
import React, { useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { ROUTES } from 'types';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}/new` };

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const [saving, setSaving] = useState(false);
  const handleSubmit = (values: any, errors: any) => {
    setSaving(true);
    console.log({ values, errors });
    setSaving(false);
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
