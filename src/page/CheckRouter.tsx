import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Check, ROUTES } from 'types';
import { CheckEditor } from 'components/CheckEditor';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { CheckList } from 'components/CheckList';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';

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
        <Route path={`${path}/new`} exact>
          <CheckEditor onReturn={returnToList} />
        </Route>
        <Route path={`${path}/edit/:id`} exact>
          <CheckEditor onReturn={returnToList} checks={checks} />
        </Route>
        <Route path={`${path}/type`} exact>
          <ChooseCheckType onReturn={returnToList} checks={checks} />
        </Route>
        <Route path={`${path}/new-multi`} exact>
          <MultiHttpSettingsForm onReturn={returnToList} checks={checks} />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
}
