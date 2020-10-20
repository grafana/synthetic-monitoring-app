import React, { FC, useEffect, useState, useContext } from 'react';
import { AppRootProps } from '@grafana/data';
import { GlobalSettings } from 'types';
import { WelcomePage } from 'page/WelcomePage';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';
import { TenantSetup } from 'components/TenantSetup';
import { InstanceContext } from './InstanceContext';

type Tab = {
  label: string;
  id: string;
  icon?: string;
  enabledByFeatureFlag?: string;
  render: (query: any) => React.ReactNode;
};

type RouterQuery = {
  page: string;
  id: string;
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
    render: (query: RouterQuery) => <ProbesPage />,
  },

  {
    label: 'Config',
    id: 'config',
    render: (query: RouterQuery) => <TenantSetup />,
  },
];

function filterTabs(tabs: Tab[], query: RouterQuery, apiInitialized: boolean): Tab[] {
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

function findActiveTab(tabs: Tab[], query: RouterQuery, apiInitialized: boolean): Tab {
  return tabs.find(tab => tab.id === query.page) ?? tabs[0];
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
  const apiInitialized = instance?.api?.instanceSettings?.jsonData?.initialized;
  const filteredTabs = filterTabs(tabs, query, apiInitialized);
  const [activeTab, setActiveTab] = useState(findActiveTab(tabs, query, apiInitialized));
  console.log('do the tabs think things are initialized?', apiInitialized);

  useEffect(() => {
    // const filteredTabs = filterTabs(tabs, query);
    console.log('in the effect');
    const activeTab = findActiveTab(filteredTabs, query, apiInitialized);
    setActiveTab(activeTab);
    onNavChanged(getNavModel(filteredTabs, path, activeTab, meta.info.logos.large));
  }, [query.id, apiInitialized]);

  return activeTab.render(query);
};
