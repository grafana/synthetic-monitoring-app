import React, { FC, useEffect, useState, useContext } from 'react';
import { AppRootProps } from '@grafana/data';
import { GlobalSettings } from 'types';
import { WelcomePage } from 'page/WelcomePage';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';
import { TenantSetup } from 'components/TenantSetup';
import { InstanceContext } from './InstanceContext';
import { getLocationSrv } from '@grafana/runtime';
import { DashboardInfo } from 'datasource/types';

type Tab = {
  label: string;
  id: string;
  icon?: string;
  enabledByFeatureFlag?: string;
  render: (query: any) => JSX.Element;
};

type RouterQuery = {
  page: string;
  id: string;
};

const pagesToRedirectIfNotInitialized = new Set(['checks', 'probes', 'config', 'redirect']);

const pagesToRedirectIfInitialized = new Set(['setup']);

const dashboardRedirects = new Set(['redirect']);

const getRedirectDestination = (queryPage: string, isInitialized: boolean): string | undefined => {
  if (!isInitialized && pagesToRedirectIfNotInitialized.has(queryPage)) {
    return 'setup';
  }
  if (isInitialized && pagesToRedirectIfInitialized.has(queryPage)) {
    return 'checks';
  }
  if (isInitialized && dashboardRedirects.has(queryPage)) {
    return '';
  }
  return;
};

const tabs: Tab[] = [
  {
    label: 'Checks',
    id: 'checks',
    render: (query: RouterQuery) => <ChecksPage id={query.id} />,
  },
  {
    label: 'Probes',
    id: 'probes',
    render: (query: RouterQuery) => <ProbesPage id={query.id} />,
  },

  {
    label: 'Config',
    id: 'config',
    render: (query: RouterQuery) => <TenantSetup />,
  },
];

function filterTabs(tabs: Tab[], apiInitialized: boolean): Tab[] {
  if (!apiInitialized) {
    return [
      {
        label: 'Setup',
        id: 'setup',
        render: (query: RouterQuery) => <WelcomePage />,
      },
    ];
  }
  return tabs;
}

function findActiveTab(tabs: Tab[], queryPage: string, apiInitialized: boolean): Tab {
  return tabs.find(tab => tab.id === queryPage) ?? tabs[0];
}

function handleDashboardRedirect(dashboard: string, dashboards: DashboardInfo[]) {
  const targetDashboard = dashboards.find(dashboardJson => dashboardJson.json.indexOf(dashboard) > -1);
  getLocationSrv().update({
    partial: false,
    path: `d/${targetDashboard?.uid}`,
  });
}

function getNavModel(tabs: Tab[], path: string, activeTab: Tab, logoUrl: string) {
  const children = tabs.map(tab => ({
    text: tab.label,
    id: tab.id,
    active: tab.id === activeTab.id,
    url: `${path}?page=${tab.id}`,
  }));

  const node = {
    text: 'Synthetic Monitoring',
    img: logoUrl,
    subTitle: 'Grafana Cloud Synthetic Monitoring',
    url: path,
    children,
  };

  return {
    main: node,
    node,
  };
}

export const PluginTabs: FC<AppRootProps<GlobalSettings>> = ({ query, onNavChanged, path, meta }) => {
  const { instance } = useContext(InstanceContext);
  const apiInitialized = Boolean(instance?.api?.instanceSettings?.jsonData?.initialized);
  const dashboards = instance?.api?.instanceSettings?.jsonData.dashboards;
  const [activeTab, setActiveTab] = useState(findActiveTab(tabs, query.page, apiInitialized));
  const logoUrl = meta.info.logos.large;

  useEffect(() => {
    const redirectDestination = getRedirectDestination(query.page, apiInitialized);
    if (redirectDestination) {
      getLocationSrv().update({
        partial: false,
        path,
        query: {
          page: redirectDestination,
        },
      });
      return;
    }
    if (query.page === 'redirect') {
      return handleDashboardRedirect(query.dashboard, dashboards ?? []);
    }
    const filteredTabs = filterTabs(tabs, apiInitialized);
    const activeTab = findActiveTab(filteredTabs, query.page, apiInitialized);
    setActiveTab(activeTab);
    onNavChanged(getNavModel(filteredTabs, path, activeTab, logoUrl));
  }, [query.page, query.dashboard, apiInitialized, logoUrl, onNavChanged, path, dashboards]);

  return activeTab.render(query);
};
