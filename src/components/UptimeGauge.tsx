import React, { PureComponent } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue, Container, IconName, Icon } from '@grafana/ui';
import { DataSourceInstanceSettings, GraphSeriesValue, DisplayValue } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { Check } from 'types';

interface Props {
  ds: DataSourceInstanceSettings;
  labelNames: string[];
  labelValues: string[];
  height: number;
  width: number;
  sparkline: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

interface State {
  filter?: string;
  value: DisplayValue;
  points: GraphSeriesValue[][];
  lastUpdate: number;
}

export class UptimeGauge extends PureComponent<Props, State> {
  state: State = {
    lastUpdate: 0,
    value: {
      numeric: 0,
      title: 'Uptime',
      text: 'loading...',
    },
    points: [],
  };

  filterString(labelNames: string[], labelValues: string[]): string {
    let filters: string[] = [];
    for (let i in labelNames) {
      const k = labelNames[i];
      const v = labelValues[i];
      filters.push(`${k}="${v}"`);
    }
    return filters.join(',');
  }

  async componentDidMount() {
    const { labelNames, labelValues } = this.props;
    const filter = this.filterString(labelNames, labelValues);
    this.setState({ filter }, this.queryUptime);
  }

  async componentDidUpdate(oldProps: Props) {
    const { labelNames, labelValues } = this.props;
    const filter = this.filterString(labelNames, labelValues);
    if (this.state.filter !== filter) {
      this.setState({ filter }, this.queryUptime);
    }
  }

  async queryUptime() {
    const { ds, sparkline } = this.props;
    const { filter } = this.state;
    if (!filter) {
      return;
    }
    const backendSrv = getBackendSrv();
    const lastUpdate = Math.floor(Date.now() / 1000);
    const resp = await backendSrv.datasourceRequest({
      method: 'GET',
      url: `${ds.url}/api/v1/query`,
      params: {
        query: `sum(rate(probe_success_sum{${filter}}[3h])) / sum(rate(probe_success_count{${filter}}[3h]))`,
        time: lastUpdate,
      },
    });
    if (!resp.ok) {
      console.log(resp);
      return;
    }
    let value: DisplayValue = {
      numeric: 0,
      title: 'Uptime',
      text: 'loading...',
    };
    if (resp.data.data.result.length < 1) {
      value.text = 'N/A';
      this.setState({ value, lastUpdate });
      return;
    }
    const uptime = parseFloat(resp.data.data.result[0].value[1]) * 100;
    let color = 'green';
    if (uptime < 99) {
      color = 'red';
    }
    value.color = color;
    value.numeric = uptime;
    value.text = uptime.toFixed(2) + '%';

    this.setState({ value, lastUpdate }, () => {
      if (sparkline) {
        this.queryHistory();
      }
    });
  }

  async queryHistory() {
    const { ds } = this.props;
    const { filter } = this.state;
    if (!filter) {
      return;
    }
    const backendSrv = getBackendSrv();
    const lastUpdate = this.state.lastUpdate + 1;
    const resp = await backendSrv.datasourceRequest({
      method: 'POST',
      url: `${ds.url}/api/v1/query_range`,
      params: {
        query: `100 * sum(rate(probe_success_sum{${filter}}[10m])) / sum(rate(probe_success_count{${filter}}[10m]))`,
        start: lastUpdate - 60 * 60 * 3,
        end: lastUpdate,
        step: 600,
      },
    });
    if (!resp.ok) {
      console.log(resp);
      return;
    }
    let points: GraphSeriesValue[][] = [];
    if (resp.data.data.result.length < 1) {
      console.log(resp.data);
      return;
    }
    let i = 0;
    for (const p of resp.data.data.result[0].values) {
      points.push([i, parseFloat(p[1])]);
      i++;
    }
    this.setState({ points: points, lastUpdate: lastUpdate + 1 });
  }

  render() {
    const { value, points } = this.state;
    const { height, width, sparkline, onClick } = this.props;
    let sparklineData = undefined;
    if (sparkline && points.length > 0) {
      sparklineData = {
        yMin: 0,
        yMax: 150,
        data: points,
      };
    }
    return (
      <Container>
        <BigValue
          theme={config.theme}
          colorMode={BigValueColorMode.Value}
          height={height}
          width={width}
          graphMode={BigValueGraphMode.Area}
          value={value}
          sparkline={sparklineData}
          onClick={onClick}
        />
      </Container>
    );
  }
}

interface CheckHealthProps {
  ds: DataSourceInstanceSettings;
  check: Check;
}

interface CheckHealthState {
  iconName: IconName;
  className: string;
}

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
    const resp = await backendSrv.datasourceRequest({
      method: 'GET',
      url: `${ds.url}/api/v1/query`,
      params: {
        query: `sum(probe_success{${filter}}) / count(probe_success{${filter}})`,
        time: lastUpdate,
      },
    });
    if (!resp.ok) {
      console.log(resp);
      return;
    }
    let iconName: IconName = 'heart';
    let className = 'ok';
    if (resp.data.data.result.length < 1) {
      iconName = 'question-circle';
      className = 'paused';
      this.setState({ iconName, className });
      return;
    }
    const uptime = parseFloat(resp.data.data.result[0].value[1]) * 100;
    if (uptime < 99) {
      className = 'warning';
    }
    if (uptime < 50) {
      className = 'critical';
      iconName = 'heart-break';
    }
    this.setState({ iconName, className });
  }

  render() {
    const { iconName, className } = this.state;
    return <Icon name={iconName} size="xxl" className={`alert-rule-item__icon alert-state-${className}`} />;
  }
}
