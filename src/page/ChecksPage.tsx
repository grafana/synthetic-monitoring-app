import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { PluginPage } from '@grafana/runtime';
import { LoadingPlaceholder, useTheme2 } from '@grafana/ui';

import { Check, CheckType, ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { useNavigation } from 'hooks/useNavigation';
import { CheckEditor } from 'components/CheckEditor';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { PLUGIN_URL_PATH } from 'components/constants';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { NewScriptedCheck } from 'components/NewScriptedCheck';
import { getRoute } from 'components/Routing';
import { ScriptedCheckCodeEditor } from 'components/ScriptedCheckCodeEditor';
import { ScriptedCheckScene } from 'scenes/Drilldown/ScriptedCheckScene';

const newCheckParent = { text: 'New check', url: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new` };

export function ChecksPage() {
  const theme = useTheme2();
  const { loading, refetchChecks } = useContext(ChecksContext);
  const navigate = useNavigation();
  const handleSubmit = async ({ id }: Check, errors: any) => {
    console.log('hiiiii', `${getRoute(ROUTES.Checks)}/${id}`);
    navigate(`${getRoute(ROUTES.Checks)}/${id}`);
  };

  const { path } = useRouteMatch();
  const returnToList = (refetch?: boolean) => {
    navigate(ROUTES.Checks);
    if (refetch) {
      refetchChecks();
    }
  };
  if (loading) {
    return <LoadingPlaceholder text={undefined} />;
  }

  return (
    <Switch>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckType />
      </Route>
      <Route path={`${path}/new/:checkType?`} exact>
        {({ match }) => {
          switch (match?.params.checkType) {
            case CheckType.K6:
              return <NewScriptedCheck />;
            case CheckType.MULTI_HTTP:
              return <MultiHttpSettingsForm onReturn={returnToList} />;
            default:
              return <CheckEditor onReturn={returnToList} />;
          }
        }}
      </Route>
      <Route path={`${path}/new/k6/builder`}>
        <PluginPage
          pageNav={{
            text: 'Test builder',
            parentItem: newCheckParent,
          }}
        >
          <SyntheticsBuilder theme={theme} onSubmit={handleSubmit} saving={false} />
        </PluginPage>
      </Route>
      <Route path={`${path}/new/k6/script-editor`}>
        <PluginPage
          pageNav={{
            text: 'Script editor',
            parentItem: newCheckParent,
          }}
        >
          <ScriptedCheckCodeEditor onSubmit={handleSubmit} saving={false} />
        </PluginPage>
      </Route>
      <Route path={`${path}`}>
        <ScriptedCheckScene />
      </Route>
    </Switch>
  );
}
