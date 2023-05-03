import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { Button, useTheme2 } from '@grafana/ui';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { ScriptedCheckCodeEditor } from 'components/ScriptedCheckCodeEditor';
import { PLUGIN_URL_PATH } from 'components/constants';
import { useNavigation } from 'hooks/useNavigation';
import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { ROUTES } from 'types';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}/new` };

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const handleSubmit = (values: any, errors: any) => {
    console.log({ values, errors });
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
          <SyntheticsBuilder theme={theme} onSubmit={handleSubmit} />
        </PluginPage>
      </Route>
      <Route path={`${path}/new/script-editor`}>
        <PluginPage
          pageNav={{
            text: 'Script editor',
            parentItem: newCheckParent,
          }}
        >
          <ScriptedCheckCodeEditor onSubmit={handleSubmit} />
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
