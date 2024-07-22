import React from 'react';
import { AppRootProps, NavModelItem, OrgRole } from '@grafana/data';

import { Settings } from 'types';
import { hasRole } from 'utils';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';

export type PageDefinition = {
  component: React.FC<AppRootProps<Settings>>;
  icon: string;
  sub: string;
  text: string;
  hidden?: boolean;
};

const pages: NavModelItem[] = [
  {
    text: 'Home',
    id: 'home',
    url: `${PLUGIN_URL_PATH}home`,
  },
  {
    text: 'Checks',
    id: 'checks',
    url: `${PLUGIN_URL_PATH}checks`,
  },
  {
    text: 'Probes',
    id: 'probes',
    url: `${PLUGIN_URL_PATH}probes`,
  },
  {
    text: 'Alerts',
    id: 'alerts',
    url: `${PLUGIN_URL_PATH}alerts`,
  },
];

if (hasRole(OrgRole.Editor)) {
  pages.push({
    text: 'Config',
    id: 'config',
    url: `${PLUGIN_URL_PATH}config`,
  });
}

export const getNavModel = (logo: string, path: string) => {
  const node = {
    text: 'Synthetic Monitoring',
    img: logo,
    subTitle: 'Grafana Cloud Synthetic Monitoring',
    url: PLUGIN_URL_PATH,
    children: pages.map((page) => {
      return {
        ...page,
        active: Boolean(page.id && path.includes(page.id)),
      };
    }),
  };

  return {
    node,
    main: node,
  };
};
