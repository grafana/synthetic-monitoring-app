import React, { useEffect, useState, useContext } from 'react';
import { AppRootProps } from '@grafana/data';
import { DashboardMeta, GlobalSettings } from 'types';
import { WelcomePage } from 'page/WelcomePage';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';
import { InstanceContext } from 'contexts/InstanceContext';
import { getLocationSrv } from '@grafana/runtime';
import { DashboardInfo } from 'datasource/types';
import { importAllDashboards, listAppDashboards } from 'dashboards/loader';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';
import { hasDismissedDashboardUpdateModal, persistDashboardModalDismiss } from 'sessionStorage';
import { Alerting } from './Alerting';
import HomePage from 'page/HomePage';

type Tab = {
  label: string;
  id: string;
  icon?: string;
  enabledByFeatureFlag?: string;
};

const pagesToRedirectIfNotInitialized = new Set(['checks', 'probes', 'alerts', 'redirect', 'home']);

const pagesToRedirectIfInitialized = new Set(['setup']);

const dashboardRedirects = new Set(['redirect']);

const getRedirectDestination = (queryPage: string, isInitialized: boolean): string | undefined => {
  if (!isInitialized && pagesToRedirectIfNotInitialized.has(queryPage)) {
    return 'setup';
  }
  if (isInitialized && pagesToRedirectIfInitialized.has(queryPage)) {
    return 'home';
  }
  if (isInitialized && dashboardRedirects.has(queryPage)) {
    return '';
  }
  return;
};

const tabs: Tab[] = [
  {
    label: 'Home',
    id: 'home',
  },
  {
    label: 'Checks',
    id: 'checks',
  },
  {
    label: 'Probes',
    id: 'probes',
  },
  {
    label: 'Alerts',
    id: 'alerts',
  },
];

function filterTabs(tabs: Tab[], apiInitialized: boolean): Tab[] {
  if (!apiInitialized) {
    return [];
  }
  return tabs;
}

function findActiveTab(tabs: Tab[], queryPage: string, apiInitialized: boolean): Tab {
  return tabs.find((tab) => tab.id === queryPage) ?? tabs[0];
}

function handleDashboardRedirect(dashboard: string, dashboards: DashboardInfo[]) {
  const targetDashboard =
    dashboards.find((dashboardJson) => dashboardJson.json.indexOf(dashboard) > -1) ?? dashboards[0];
  getLocationSrv().update({
    partial: false,
    path: `/d/${targetDashboard.uid}`,
  });
}

function getNavModel(tabs: Tab[], path: string, activeTab: Tab, logoUrl: string) {
  const children = tabs.map((tab) => ({
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

export const PluginTabs = ({ query, onNavChanged, path, meta }: AppRootProps<GlobalSettings>) => {
  const { instance } = useContext(InstanceContext);
  const [hasDismissedDashboardUpdate, setHasDismissedDashboardUpdate] = useState(hasDismissedDashboardUpdateModal());
  const [dashboardsNeedingUpdate, setDashboardsNeedingUpdate] = useState<DashboardMeta[] | undefined>();
  const hasStackId = Boolean(meta?.jsonData?.stackId);
  // We are using the presence of stack id in json data to determine whether the plugin has been provisioned or not
  const apiInitialized = Boolean(instance.api?.instanceSettings?.jsonData?.initialized || !hasStackId);
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;
  const [activeTab, setActiveTab] = useState(findActiveTab(tabs, query.page, apiInitialized));
  const logoUrl = meta.info.logos.large;

  function skipDashboardUpdate() {
    persistDashboardModalDismiss();
    setHasDismissedDashboardUpdate(true);
  }

  // Prompt user to update dashboards that are out of date
  useEffect(() => {
    if (!hasDismissedDashboardUpdate) {
      listAppDashboards().then((latestDashboards) => {
        const existingDashboards = dashboards ?? [];
        const dashboardsNeedingUpdate = existingDashboards
          .map((existingDashboard) => {
            const templateDashboard = latestDashboards.find((template) => template.uid === existingDashboard.uid);
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
  }, [query, query.dashboard, apiInitialized, logoUrl, onNavChanged, path, dashboards]);

  if (query.page === 'setup' || !activeTab) {
    return <WelcomePage />;
  }

  const getPage = () => {
    switch (activeTab.id) {
      case 'probes':
        return <ProbesPage id={query.id} />;
      case 'alerts':
        return <Alerting />;
      case 'checks':
        return <ChecksPage id={query.id} />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div>
      {getPage()}
      <Modal
        title="Dashboards out of date"
        onDismiss={skipDashboardUpdate}
        isOpen={Boolean(dashboardsNeedingUpdate?.length) && !hasDismissedDashboardUpdate}
      >
        <p>It looks like your Synthetic Monitoring dashboards need an update.</p>
        <HorizontalGroup>
          <Button
            onClick={async () => {
              if (!instance.api) {
                return;
              }
              const responses = await importAllDashboards(
                instance.metrics?.name ?? '',
                instance.logs?.name ?? '',
                instance.api?.name ?? ''
              );
              const updatedSettings = {
                ...instance.api.instanceSettings.jsonData,
                dashboards: responses,
              };
              await instance.api?.onOptionsChange(updatedSettings);

              getLocationSrv().update({
                partial: false,
                path: 'plugins/grafana-synthetic-monitoring-app/',
                query: {},
              });
              skipDashboardUpdate();
              window.location.reload();
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
