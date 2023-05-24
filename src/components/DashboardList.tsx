import React, { PureComponent } from 'react';
import { Icon } from '@grafana/ui';
import { DashboardInfo, SMOptions } from 'datasource/types';
import { listAppDashboards, importDashboard, removeDashboard } from 'dashboards/loader';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {
  checkUpdates: boolean;
  options: SMOptions;
  onChange?: (options: SMOptions) => void;
}

interface State {
  dashboards: DashboardInfo[];
}

export class DashboardList extends PureComponent<Props, State> {
  static contextType = InstanceContext;

  state: State = {
    dashboards: this.props.options.dashboards,
  };

  async componentDidMount() {
    const { checkUpdates, onChange, options } = this.props;
    if (!checkUpdates || !onChange) {
      return;
    }
    const latestDashboards = await listAppDashboards();

    // merge dashboards known to grafana with latest in the app.
    const dashboards = latestDashboards.map((template) => {
      const existingDashboard = options.dashboards.find((existing) => template.uid === existing.uid);
      if (!existingDashboard) {
        return template;
      }
      return {
        ...existingDashboard,
        latestVersion: template.latestVersion,
      };
    });

    this.setState({ dashboards });
  }

  onImport = (dashboard: DashboardInfo) => async () => {
    const { onChange, options } = this.props;
    const { instance } = this.context;
    if (!onChange) {
      return;
    }
    const smDsName = instance?.api?.instanceSettings?.name;
    const metricsUid = instance?.api?.instanceSettings.jsonData?.metrics?.uid;
    const logsUid = instance?.api?.instanceSettings.jsonData?.logs?.uid;
    const updatedDashboard = await importDashboard(
      dashboard.json,
      metricsUid ?? options.metrics.grafanaName,
      logsUid ?? options.logs.grafanaName,
      smDsName
    );

    let updated = false;

    const dashboards = options.dashboards.map((savedDashboard) => {
      if (savedDashboard.uid === updatedDashboard.uid) {
        updated = true;
        return updatedDashboard;
      }
      return savedDashboard;
    });

    // Handles the case of a new dashboard being added instead of an existing one being updated
    if (!updated) {
      dashboards.push(updatedDashboard);
    }

    const updatedOptions = {
      ...options,
      dashboards,
    };
    this.setState({ dashboards });
    return onChange(updatedOptions);
  };

  onRemove = (dashboard: DashboardInfo) => async () => {
    const { onChange } = this.props;
    if (!onChange) {
      return;
    }
    let options = { ...this.props.options };
    await removeDashboard(dashboard);

    let i = options.dashboards.findIndex((item) => {
      return item.uid === dashboard.uid;
    });

    if (i >= 0) {
      options.dashboards.splice(i, 1);
    }

    let dashboards = [...this.state.dashboards];
    i = dashboards.findIndex((item) => {
      return item.uid === dashboard.uid;
    });
    if (i >= 0) {
      dashboards[i].version = 0;
    }

    this.setState({ dashboards });
    return onChange(options);
  };

  withImports(dashboard: DashboardInfo) {
    const { checkUpdates } = this.props;
    if (!checkUpdates) {
      return;
    }
    function buttonText(dashboard: DashboardInfo) {
      return (dashboard.latestVersion || 0) > (dashboard.version || 0) ? 'Update' : 'Re-import';
    }
    return (
      <td style={{ textAlign: 'right' }}>
        {dashboard.version === 0 ? (
          <button className="btn btn-secondary btn-small" onClick={this.onImport(dashboard)}>
            Import
          </button>
        ) : (
          <button className="btn btn-secondary btn-small" onClick={this.onImport(dashboard)}>
            {buttonText(dashboard)}
          </button>
        )}
        {dashboard.version !== 0 && (
          <button className="btn btn-danger btn-small" onClick={this.onRemove(dashboard)}>
            <Icon name="trash-alt" />
          </button>
        )}
      </td>
    );
  }

  render() {
    const { dashboards } = this.state;

    return (
      <div>
        <h3>Dashboards:</h3>
        <table className="filter-table">
          <tbody>
            {dashboards.map((d) => {
              return (
                <tr key={d.uid}>
                  <td className="width-1">
                    <Icon name="apps" />
                  </td>
                  <td>
                    <a href={`d/${d.uid}/`}>{d.title}</a>
                  </td>
                  {this.withImports(d)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
