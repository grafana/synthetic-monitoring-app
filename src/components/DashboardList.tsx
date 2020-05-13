import React, { PureComponent } from 'react';
import { Icon } from '@grafana/ui';
import { DashboardInfo } from 'datasource/types';

interface Props {
  dashboards: DashboardInfo[];
}

interface State {}

export class DashboardList extends PureComponent<Props, State> {
  state: State = {};

  render() {
    const { dashboards } = this.props;
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
