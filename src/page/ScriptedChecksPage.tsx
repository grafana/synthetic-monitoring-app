import { GrafanaTheme, SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { Button, useTheme2 } from '@grafana/ui';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { ScriptedCheckCodeEditor } from 'components/ScriptedCheckCodeEditor';
import { PLUGIN_URL_PATH } from 'components/constants';
import { useNavigation } from 'hooks/useNavigation';
import React, { useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { ROUTES } from 'types';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}/new` };

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const [saving, setSaving] = useState(false);
  // TODO: the test builder is duplicating the grafana theme type slightly incorrectly so we have to cast here. Update them to be compatible
  const builderTheme = theme as unknown as GrafanaTheme;
  const handleSubmit = (values: any, errors: any) => {
    setSaving(true);
    console.log({ values, errors });
    setSaving(false);
  };
  const navigate = useNavigation();
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
          <SyntheticsBuilder theme={builderTheme} onSubmit={handleSubmit} saving={saving} />
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
        <PluginPage pageNav={{ text: 'Scripted checks', description: 'List of checks' }}>
          <Button onClick={() => navigate(`${ROUTES.ScriptedChecks}/new`)}>Add new</Button>
          <ul>
            <li>check one</li>
            <li>check two</li>
          </ul>
        </PluginPage>
      </Route>
    </Switch>
  );
}
