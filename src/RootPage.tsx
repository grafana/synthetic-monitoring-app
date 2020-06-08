// Libraries
import React, { PureComponent } from 'react';

// Types
import { NavModelItem, AppRootProps, DataSourceInstanceSettings } from '@grafana/data';
import { GlobalSettings, RegistrationInfo, GrafanaInstances, OrgRole } from './types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { findWorldPingDataSources, createNewWorldpingInstance, hasRole } from 'utils';
import { WorldpingOptions, DashboardInfo } from 'datasource/types';
import { getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { TenantSetup } from './components/TenantSetup';
import { TenantView } from 'components/TenantView';
import { DashboardList } from 'components/DashboardList';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';

interface Props extends AppRootProps<GlobalSettings> {}
interface State {
  settings: Array<DataSourceInstanceSettings<WorldpingOptions>>;
  instance?: GrafanaInstances;
  info?: RegistrationInfo;
  valid?: boolean;
}

export class RootPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      settings: findWorldPingDataSources(),
    };
  }

  async loadInstances() {
    const settings = this.state.settings[0];
    if (settings && settings.name) {
      const worldping = (await getDataSourceSrv().get(settings.name)) as WorldPingDataSource;
      if (worldping) {
        let global = worldping.instanceSettings.jsonData;
        const instance: GrafanaInstances = {
          worldping,
          metrics: await loadDataSourceIfExists(global?.metrics?.grafanaName),
          logs: await loadDataSourceIfExists(global?.logs?.grafanaName),
        };

        this.setState({
          instance,
          valid: isValid(instance),
        });
        this.updateNav();
        return;
      }
    }

    // Create a new instance
    if (true) {
      console.log('Creating a new datasource TODO, check user auth');
      await createNewWorldpingInstance();
      console.log('Reload the windows (will redirect)');
      window.location.reload(); // force reload
    }
  }

  async componentDidMount() {
    this.updateNav();
    this.loadInstances();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.query !== prevProps.query) {
      if (this.props.query.page !== prevProps.query.page) {
        this.updateNav();
      }
    }
  }

  updateNav() {
    const { path, onNavChanged, query, meta } = this.props;
    const selected = query.page || 'status';
    const tabs: NavModelItem[] = [];
    if (this.state.valid && selected !== 'setup' && selected !== 'redirect') {
      tabs.push({
        text: 'Status',
        // icon: 'fa fa-fw fa-file-text-o',
        url: path,
        id: 'status',
      });
      tabs.push({
        text: 'Checks',
        url: path + '?page=checks',
        id: 'checks',
      });
      tabs.push({
        text: 'Probes',
        url: path + '?page=probes',
        id: 'probes',
      });
    } else if (this.state.valid && selected === 'redirect') {
      tabs.push({
        text: 'Dashboard Redirect',
        url: path + '?page=redirect',
        id: 'redirect',
      });
      tabs.push({
        text: 'Status',
        // icon: 'fa fa-fw fa-file-text-o',
        url: path,
        id: 'status',
      });
    } else {
      tabs.push({
        text: 'Setup',
        // icon: 'fa fa-fw fa-file-text-o',
        url: path,
        id: 'setup',
      });
    }

    // Set the active tab
    let found = false;

    for (const tab of tabs) {
      tab.active = !found && selected === tab.id;
      if (tab.active) {
        found = true;
      }
    }
    if (!found) {
      tabs[0].active = true;
    }

    const node = {
      text: 'worldPing',
      img: meta.info.logos.large,
      subTitle: 'Global Blackbox Monitoring',
      url: path,
      children: tabs,
    };

    // Update the page header
    onNavChanged({
      node: node,
      main: node,
    });
  }

  //-----------------------------------------------------------------------------------------
  // Multiple Config
  //-----------------------------------------------------------------------------------------
  renderMultipleConfigs() {
    return <div>TODO... multiple instances... delete one!!!!</div>;
  }

  //-----------------------------------------------------------------------------------------
  // Setup
  //-----------------------------------------------------------------------------------------
  renderStatus() {
    const { instance } = this.state;
    const options = instance!.worldping.instanceSettings.jsonData;
    return (
      <div>
        <DashboardList options={options} checkUpdates={false} />
        <br />
        {hasRole(OrgRole.EDITOR) && <TenantView settings={options} />}
      </div>
    );
  }

  dashboardRedirect() {
    const { instance } = this.state;
    const { query } = this.props;
    if (!instance) {
      return <div>Loading.... (or maybe a user permissions error?)</div>;
    }
    if (!query.dashboard) {
      return <div>Dashboard not found</div>;
    }
    const dashboards = instance!.worldping.instanceSettings.jsonData.dashboards;
    let target: DashboardInfo | undefined = undefined;
    for (const item of dashboards) {
      if (item.title.toLocaleLowerCase() === 'worldping ' + query.dashboard) {
        target = item;
      }
    }

    if (!target) {
      console.log('dashboard not found.', query);
      return <div>Dashboard not found</div>;
    }

    const d = `d/${target.uid}`;
    let q = { ...query };
    delete q.dashboard;
    delete q.page;
    getLocationSrv().update({
      partial: false,
      path: d,
      query: q,
    });
    return null;
  }

  //-----------------------------------------------------------------------------------------
  // Setup
  //-----------------------------------------------------------------------------------------
  renderSetup() {
    const { instance } = this.state;
    if (!instance) {
      return <div>Loading.... (or maybe a user permissions error?)</div>;
    }

    return <TenantSetup instance={instance.worldping} />;
  }

  render() {
    const { settings, valid, instance } = this.state;
    if (settings.length > 1) {
      return this.renderMultipleConfigs();
    }
    const { query } = this.props;
    if (!valid || query.page === 'setup') {
      return this.renderSetup();
    }

    if ('dashboard' in query) {
      return this.dashboardRedirect();
    }

    if (query.page === 'checks') {
      return <ChecksPage instance={instance!} id={query.id} />;
    }
    if (query.page === 'probes') {
      return <ProbesPage instance={instance!} id={query.id} />;
    }

    return this.renderStatus();
  }
}

async function loadDataSourceIfExists(name?: string) {
  if (name) {
    try {
      return await getDataSourceSrv().get();
    } catch {}
  }
  return undefined;
}

function isValid(instance: GrafanaInstances): boolean {
  if (!instance || !instance.logs || !instance.metrics || !instance.worldping) {
    return false;
  }
  return true;
}
