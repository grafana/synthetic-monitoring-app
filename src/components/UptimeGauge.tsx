import React, { PureComponent } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue, Container } from '@grafana/ui';
import { DataSourceInstanceSettings, GraphSeriesValue, DisplayValue } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';

interface GaugeData {
  value: DisplayValue;
  points: GraphSeriesValue[][];
}

interface Props {
  probe: string;
  ds: DataSourceInstanceSettings;
}

interface State {
  data: GaugeData;
  lastUpdate: number;
}

export class ProbeUptime extends PureComponent<Props, State> {
  state: State = {
    lastUpdate: 0,
    data: {
      value: {
        numeric: 0,
        title: 'Uptime',
        text: 'loading...',
      },
      points: [],
    },
  };

  async componentDidMount() {
    this.queryUptime();
  }

  async queryUptime() {
    const { ds, probe } = this.props;
    const backendSrv = await getBackendSrv();
    const lastUpdate = Math.floor(Date.now() / 1000);
    const resp = await backendSrv.datasourceRequest({
      method: 'GET',
      url: `${ds.url}/api/v1/query`,
      params: {
        query: `sum(sum_over_time(probe_success{probe="${probe}"}[24h])) / sum(count_over_time(probe_success{probe="${probe}"}[24h]))`,
        time: lastUpdate,
      },
    });
    if (!resp.ok) {
      console.log(resp);
      return;
    }
    let { data } = this.state;
    if (resp.data.data.result.length < 1) {
      data.value.text = 'N/A';
      this.setState({ data, lastUpdate });
      return;
    }
    const uptime = parseFloat(resp.data.data.result[0].value[1]) * 100;
    let color = 'green';
    if (uptime < 99) {
      color = 'red';
    }
    data.value.color = color;
    data.value.numeric = uptime;
    data.value.text = uptime.toFixed(2) + '%';

    this.setState({ data, lastUpdate });
    this.queryHistory();
  }

  async queryHistory() {
    const { ds, probe } = this.props;
    const backendSrv = await getBackendSrv();
    const lastUpdate = this.state.lastUpdate + 1;
    const resp = await backendSrv.datasourceRequest({
      method: 'POST',
      url: `${ds.url}/api/v1/query_range`,
      params: {
        query: `100 * sum(sum_over_time(probe_success{probe="${probe}"}[10m])) / sum(count_over_time(probe_success{probe="${probe}"}[10m]))`,
        start: lastUpdate - 60 * 60 * 24,
        end: lastUpdate,
        step: 600,
      },
    });
    if (!resp.ok) {
      console.log(resp);
      return;
    }
    let { data } = this.state;
    if (resp.data.data.result.length < 1) {
      console.log(resp.data);
      return;
    }
    let points: GraphSeriesValue[][] = [];
    let i = 0;
    for (const p of resp.data.data.result[0].values) {
      points.push([i, parseFloat(p[1])]);
      i++;
    }
    data.points = points;
    console.log(data.points);
    this.setState({ data: data, lastUpdate: lastUpdate + 1 });
  }

  render() {
    const { data } = this.state;
    const sparkline = {
      yMin: 0,
      yMax: 200,
      data: data.points,
    };

    return (
      <Container>
        <BigValue
          theme={config.theme}
          colorMode={BigValueColorMode.Value}
          height={200}
          width={300}
          graphMode={BigValueGraphMode.Area}
          value={data.value}
          sparkline={sparkline}
        />
      </Container>
    );
  }
}
