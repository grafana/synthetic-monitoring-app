import React, { FC, useEffect, useState, useContext } from 'react';
import { AppRootProps } from '@grafana/data';
import { DashboardMeta, GlobalSettings } from 'types';
import { WelcomePage } from 'page/WelcomePage';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';
import { TenantSetup } from 'components/TenantSetup';
import { InstanceContext } from './InstanceContext';
import { getLocationSrv } from '@grafana/runtime';
import { DashboardInfo } from 'datasource/types';
import { listAppDashboards } from 'dashboards/loader';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';

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
    return [];
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
  if (tabs.length) {
    return {
      main: node,
      node,
    };
  }
  return null;
}

export const PluginTabs: FC<AppRootProps<GlobalSettings>> = ({ query, onNavChanged, path, meta }) => {
  const { instance } = useContext(InstanceContext);
  const [hasDismissedDashboardUpdate, setHasDismissedDashboardUpdate] = useState(
    Boolean(window.sessionStorage.getItem('hasDismissedDashboardUpdate'))
  );
  const [dashboardsNeedingUpdate, setDashboardsNeedingUpdate] = useState<DashboardMeta[] | undefined>();
  const apiInitialized = Boolean(instance?.api?.instanceSettings?.jsonData?.initialized);
  const dashboards = instance?.api?.instanceSettings?.jsonData.dashboards;
  const [activeTab, setActiveTab] = useState(findActiveTab(tabs, query.page, apiInitialized));
  const logoUrl = meta.info.logos.large;

  function skipDashboardUpdate() {
    window.sessionStorage.setItem('hasDismissedDashboardUpdate', 'true');
    setHasDismissedDashboardUpdate(true);
  }

  // Prompt user to update dashboards that are out of date
  useEffect(() => {
    if (!hasDismissedDashboardUpdate) {
      listAppDashboards().then(latestDashboards => {
        const existingDashboards = dashboards ?? [];
        const dashboardsNeedingUpdate = existingDashboards
          .map(existingDashboard => {
            const templateDashboard = latestDashboards.find(template => template.uid === existingDashboard.uid);
            const templateVersion = templateDashboard?.latestVersion ?? -1;
            if (templateDashboard && templateVersion > existingDashboard.version) {
              return {
                ...existingDashboard,
                version: templateDashboard.latestVersion,
                latestVersion: templateDashboard.latestVersion,
              };
            }
            return null;
          })
          .filter(Boolean) as DashboardMeta[];

        setDashboardsNeedingUpdate(dashboardsNeedingUpdate);
      });
    }
  }, [dashboards, hasDismissedDashboardUpdate]);

  // handle navigation
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
    const navModel = getNavModel(filteredTabs, path, activeTab, logoUrl);
    if (navModel) {
      onNavChanged(navModel);
    }
  }, [query.page, query.dashboard, apiInitialized, logoUrl, onNavChanged, path, dashboards]);

  if (query.page === 'setup') {
    return <WelcomePage />;
  }

  return (
    <div>
      {activeTab.render(query)}
      <Modal
        title="Dashboards out of date"
        onDismiss={skipDashboardUpdate}
        isOpen={Boolean(dashboardsNeedingUpdate?.length) && !hasDismissedDashboardUpdate}
      >
        <p>It looks like your Synthetic Monitoring dashboards need an update.</p>
        <HorizontalGroup>
          <Button
            onClick={() => {
              getLocationSrv().update({
                partial: false,
                query: {
                  page: 'config',
                },
              });
              skipDashboardUpdate();
            }}
          >
            Update
          </Button>
          <Button onClick={skipDashboardUpdate} variant="link">
            Skip
          </Button>
        </HorizontalGroup>
      </Modal>
    </div>
  );
};
