import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Switch, Redirect, Route, useRouteMatch, RouteChildrenProps } from 'react-router-dom';
import { Check, CheckType, FeatureName, ROUTES } from 'types';
import { CheckEditor } from 'components/CheckEditor';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { CheckList } from 'components/CheckList';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { useNavigation } from 'hooks/useNavigation';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { PluginPage } from 'components/PluginPage';
import { PLUGIN_URL_PATH } from 'components/constants';

export function CheckRouter() {
  const { instance } = useContext(InstanceContext);
  const [checks, setChecks] = useState<Check[]>();
  const [loading, setLoading] = useState(true);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);

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
          {({ match }: RouteChildrenProps<{ checkType: string }>) =>
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
        {/* If user lands at /choose-type but multihttp isnt enabled, they should be redirected to /new */}
        {multiHttpEnabled ? (
          <Route path={`${path}/choose-type`} exact>
            <ChooseCheckType />
          </Route>
        ) : (
          <Redirect to={`${PLUGIN_URL_PATH}${ROUTES.NewCheck}`} />
        )}
      </Switch>
    </SuccessRateContextProvider>
  );
}
