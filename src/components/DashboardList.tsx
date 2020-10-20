import React, { PureComponent } from 'react';
import { Icon } from '@grafana/ui';
import { DashboardInfo, SMOptions } from 'datasource/types';
import { listAppDashboards, importDashboard, removeDashboard } from 'dashboards/loader';

interface Props {
  checkUpdates: boolean;
  options: SMOptions;
  onChange?: (options: SMOptions) => void;
}

interface State {
  dashboards: DashboardInfo[];
}

export class DashboardList extends PureComponent<Props, State> {
  state: State = {
    dashboards: this.props.options.dashboards,
  };

  async componentDidMount() {
    const { checkUpdates, onChange } = this.props;
    if (!checkUpdates || !onChange) {
      return;
    }

    // merge dashboards known to grafana with latest in the app.
    let dashboards = [...this.state.dashboards];
    const latestDashboards = await listAppDashboards();
    for (const dashboard of latestDashboards) {
      let i = dashboards.findIndex(item => {
        return item.uid === dashboard.uid;
      });
      if (i < 0) {
        dashboards.push(dashboard);
      } else {
        dashboards[i].latestVersion = dashboard.latestVersion;
        if (!dashboards[i].version) {
          dashboards[i].version = -1;
        }
      }
    }
    console.log(dashboards);
    this.setState({ dashboards });
  }

  onImport = (dashboard: DashboardInfo) => async () => {
    const { onChange } = this.props;
    if (!onChange) {
      return;
    }
    let options = { ...this.props.options };
    const updated = await importDashboard(dashboard.json, options.metrics.grafanaName, options.logs.grafanaName);
    console.log('dashboard updated');
    let i = options.dashboards.findIndex(item => {
      return item.uid === updated.uid;
    });
    if (i < 0) {
      options.dashboards.push(updated);
    } else {
      options.dashboards[i] = updated;
    }

    let dashboards = [...this.state.dashboards];
    i = dashboards.findIndex(item => {
      return item.uid === updated.uid;
    });
    if (i < 0) {
      dashboards.push(updated);
    } else {
      dashboards[i] = updated;
    }

    this.setState({ dashboards });
    return onChange(options);
  };

  onRemove = (dashboard: DashboardInfo) => async () => {
    const { onChange } = this.props;
    if (!onChange) {
      return;
    }
    let options = { ...this.props.options };
    await removeDashboard(dashboard);

    let i = options.dashboards.findIndex(item => {
      return item.uid === dashboard.uid;
    });

    if (i >= 0) {
      options.dashboards.splice(i, 1);
    }

    let dashboards = [...this.state.dashboards];
    i = dashboards.findIndex(item => {
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
            {dashboards.map(d => {
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
