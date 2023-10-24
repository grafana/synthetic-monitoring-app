import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { PluginPage } from 'components/PluginPage';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { Check, CheckType, ROUTES } from 'types';

export function CheckRouter() {
  const { instance } = useContext(InstanceContext);
  const [checks, setChecks] = useState<Check[]>();
  const [loading, setLoading] = useState(true);

  const navigate = useNavigation();
  const { path } = useRouteMatch();

  const fetchChecks = useCallback(() => {
    instance.api?.listChecks().then((resp) => {
      setChecks(resp);
      setLoading(false);
    });
  }, [instance.api]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const returnToList = (refetch?: boolean) => {
    navigate(ROUTES.Checks);
    if (refetch) {
      fetchChecks();
    }
  };

  if (loading || !instance.api || !checks) {
    return <PluginPage>Loading...</PluginPage>;
  }

  return (
    <SuccessRateContextProvider checks={checks}>
      <Switch>
        <Route path={path} exact>
          <CheckList instance={instance} checks={checks ?? []} onCheckUpdate={returnToList} />
        </Route>
        <Route path={`${path}/new/:checkType?`}>
          {({ match }) =>
            match?.params.checkType !== CheckType.MULTI_HTTP ? (
              <CheckEditor onReturn={returnToList} />
            ) : (
              <MultiHttpSettingsForm onReturn={returnToList} checks={checks} />
            )
          }
        </Route>
        <Route path={`${path}/edit/multihttp/:id`} exact>
          <MultiHttpSettingsForm onReturn={returnToList} checks={checks} />
        </Route>
        <Route path={`${path}/edit/:checkType/:id`} exact>
          <CheckEditor onReturn={returnToList} checks={checks} />
        </Route>
        <Route path={`${path}/choose-type`} exact>
          <ChooseCheckType />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
}
