import React, { PureComponent } from 'react';
import { IconName, Icon } from '@grafana/ui';
import { DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Check } from 'types';

interface CheckHealthProps {
  ds: DataSourceInstanceSettings;
  check: Check;
}

interface CheckHealthState {
  iconName: IconName;
  className: string;
  errorMessage?: string;
}

const getIconClassName = (uptime: number) => {
  if (uptime < 50) {
    return 'critical';
  }
  if (uptime < 99) {
    return 'warning';
  }
  return 'ok';
};

export class CheckHealth extends PureComponent<CheckHealthProps, CheckHealthState> {
  state: CheckHealthState = {
    iconName: 'heart',
    className: 'paused',
  };

  async componentDidMount() {
    const { check } = this.props;
    if (!check.enabled) {
      this.setState({ iconName: 'pause' });
      return;
    }
    await this.queryUptime();
  }

  async componentDidUpdate(oldProps: CheckHealthProps) {
    if (this.props.check.id === oldProps.check.id) {
      return;
    }
    const { check } = this.props;
    if (!check.enabled) {
      this.setState({ iconName: 'pause' });
      return;
    }
    await this.queryUptime();
  }

  async queryUptime() {
    const { ds, check } = this.props;
    const filter = `instance="${check.target}", job="${check.job}"`;

    const backendSrv = getBackendSrv();
    const lastUpdate = Math.floor(Date.now() / 1000);

    try {
      const resp = await backendSrv.datasourceRequest({
        method: 'GET',
        url: `${ds.url}/api/v1/query`,
        params: {
          query: `sum(probe_success{${filter}}) / count(probe_success{${filter}})`,
          time: lastUpdate,
        },
      });

      if (!resp.ok) {
        console.log('hello?');
        console.log(resp);
        return;
      }

      const results = resp.data?.data?.result;

      if (!results || results.length < 1) {
        this.setState({ iconName: 'question-circle', className: 'paused' });
        return;
      }

      const uptime = parseFloat(results[0].value[1]) * 100;
      const iconName = uptime < 50 ? 'heart-break' : 'heart';

      this.setState({ iconName, className: getIconClassName(uptime) });
    } catch (e) {
      this.setState({ iconName: 'exclamation-triangle', className: 'critical', errorMessage: e.data?.message });
    }
  }

  render() {
    const { iconName, className } = this.state;
    return <Icon name={iconName} size="xxl" className={`alert-rule-item__icon alert-state-${className}`} />;
  }
}
