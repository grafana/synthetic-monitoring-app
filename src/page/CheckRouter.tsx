import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckType, ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { K6CheckCodeEditor } from 'components/K6CheckCodeEditor';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { PluginPage } from 'components/PluginPage';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

export function CheckRouter() {
  const { instance } = useContext(InstanceContext);
  const { refetchChecks, checks, loading } = useContext(ChecksContext);

  const navigate = useNavigation();
  const { path } = useRouteMatch();

  const returnToList = (refetch?: boolean) => {
    navigate(ROUTES.Checks);
    if (refetch) {
      refetchChecks();
    }
  };

  if (loading || !instance.api || !checks) {
    return <PluginPage>Loading...</PluginPage>;
  }

  return (
    <SuccessRateContextProvider>
      <Switch>
        <Route path={path} exact>
          <CheckList instance={instance} onCheckUpdate={returnToList} />
        </Route>
        <Route path={`${path}/new/:checkType?`}>
          {({ match }) => {
            switch (match?.params.checkType) {
              case CheckType.MULTI_HTTP:
                return <MultiHttpSettingsForm onReturn={returnToList} />;
              case CheckType.K6:
                return <K6CheckCodeEditor checks={checks} onSubmitSuccess={returnToList} />;
              default:
                return <CheckEditor onReturn={returnToList} checks={checks} />;
            }
          }}
        </Route>
        <Route path={`${path}/edit/:checkType/:id`} exact>
          {({ match }) => {
            switch (match?.params.checkType) {
              case CheckType.MULTI_HTTP:
                return <MultiHttpSettingsForm onReturn={returnToList} />;
              case CheckType.K6:
                return <K6CheckCodeEditor checks={checks} onSubmitSuccess={returnToList} />;
              default:
                return <CheckEditor onReturn={returnToList} checks={checks} />;
            }
          }}
        </Route>
        <Route path={`${path}/choose-type`} exact>
          <ChooseCheckType />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
}
