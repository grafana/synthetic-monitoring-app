import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';

import { ROUTES } from '../../types';
import { VerifiedMeta } from 'contexts/MetaContext';

import { getRoute } from '../../components/Routing.utils';
import { GeneralTab } from './tabs/GeneralTab';
import { SecretsTab } from './tabs/SecretsTab';

interface ConfigPageV2Props {
  meta: VerifiedMeta;
  initialized?: boolean;
}

export function ConfigPageV2({ meta, initialized }: ConfigPageV2Props) {
  const matchGeneral = useRouteMatch(getRoute(ROUTES.Config));
  const matchSecrets = useRouteMatch(getRoute(ROUTES.ConfigSecrets));

  const pageNav: NavModelItem = {
    icon: 'sliders-v-alt',
    text: 'Config',
    subTitle: 'Configure your Synthetic Monitoring settings',
    hideFromBreadcrumbs: true,

    children: [
      {
        icon: 'cog',
        text: 'General',
        url: getRoute(ROUTES.Config),
        active: !!matchGeneral && !matchSecrets,
      },
      {
        icon: 'lock',
        text: 'Secrets management',
        url: getRoute(ROUTES.ConfigSecrets),
        active: !!matchSecrets,
        hideFromTabs: false,
      },
    ],
  };

  return (
    <PluginPage pageNav={pageNav}>
      <Switch>
        <Route path={getRoute(ROUTES.Config)} exact>
          <GeneralTab initialized={initialized} meta={meta} />
        </Route>
        <Route path={getRoute(ROUTES.ConfigSecrets)}>
          <SecretsTab />
        </Route>
      </Switch>
    </PluginPage>
  );
}
