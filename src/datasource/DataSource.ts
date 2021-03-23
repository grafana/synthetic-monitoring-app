import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  ArrayDataFrame,
  DataFrame,
} from '@grafana/data';

import { SMQuery, SMOptions, QueryType } from './types';

import { config, getBackendSrv } from '@grafana/runtime';
import { Probe, Check, RegistrationInfo, HostedInstance } from '../types';
import { queryLogs } from 'utils';
import { makeEdgesDataFrame } from '@grafana/ui/components/NodeGraph/utils';

export class SMDataSource extends DataSourceApi<SMQuery, SMOptions> {
  constructor(public instanceSettings: DataSourceInstanceSettings<SMOptions>) {
    super(instanceSettings);
  }

  getMetricsDS() {
    return config.datasources[this.instanceSettings.jsonData.metrics.grafanaName];
  }

  getLogsDS() {
    return config.datasources[this.instanceSettings.jsonData.logs.grafanaName];
  }

  async query(options: DataQueryRequest<SMQuery>): Promise<DataQueryResponse> {
    const data: DataFrame[] = [];
    for (const query of options.targets) {
      if (query.queryType === QueryType.Probes) {
        const probes = await this.listProbes();
        const frame = new ArrayDataFrame(probes);
        frame.setFieldType('onlineChange', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('created', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('modified', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.refId = query.refId;
        data.push(frame);
      } else if (query.queryType === QueryType.Checks) {
        const checks = await this.listChecks();
        const frame = new ArrayDataFrame(checks);
        frame.setFieldType('created', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.setFieldType('modified', FieldType.time, (s: number) => s * 1000); // seconds to ms
        frame.refId = query.refId;

        const copy: DataFrame = {
          ...frame,
          fields: frame.fields,
          length: checks.length,
        };

        console.log('FRAME', frame.length);
        data.push(copy);
      } else if (query.queryType === QueryType.Traceroute) {
        const logsUrl = this.getLogsDS().url;
        if (!logsUrl) {
          console.log('Could not find logs datasource');
          return { data };
        }
        const response = await queryLogs(logsUrl);

        const groupedByTraceID = response.data.reduce((acc, { stream }) => {
          const traceId = stream['TraceID'];
          if (!traceId) {
            return acc;
          }

          if (acc[traceId]) {
            acc[traceId].push(stream);
          } else {
            acc[traceId] = [stream];
          }
          return acc;
        }, {});

        console.log({ groupedByTraceID });

        const groupedByHost = response.data.reduce((acc, { stream }, index) => {
          const traceId = stream.TraceID;
          if (!traceId) {
            return acc;
          }
          const ttl = parseInt(stream.TTL, 10);
          const nextNode = groupedByTraceID[traceId].find(
            (destinationNode) => parseInt(destinationNode.TTL, 10) === ttl + 1
          );
          if (nextNode) {
            stream.nextHost = nextNode.Host;
          }

          if (acc[stream.Host]) {
            acc[stream.Host].push(stream);
          } else {
            acc[stream.Host] = [stream];
          }
          return acc;
        }, {});

        console.log({ groupedByHost });

        const frameData = Object.entries(groupedByHost).reduce(
          (acc, [host, streamArray], index) => {
            // const host = stream.Host;

            streamArray.forEach((stream) => {
              if (stream.nextHost) {
                acc.edges.push({
                  id: `${host}${stream.nextHost}`,
                  source: host,
                  target: stream.nextHost,
                });
              }
            });

            acc.nodes.push({
              id: host,
              mainStat: host,
              title: streamArray[0].ElapsedTime,
              arc_node: 1,
            });
            return acc;
          },
          { nodes: [], edges: [] }
        );
        const nodeFrame = new ArrayDataFrame(frameData.nodes);
        nodeFrame.meta = {
          preferredVisualisationType: 'nodeGraph',
        };
        const edgeFrame = new ArrayDataFrame(frameData.edges);
        edgeFrame.meta = {
          preferredVisualisationType: 'nodeGraph',
        };
        data.push(nodeFrame);
        data.push(edgeFrame);
      }
    }
    return { data };
  }

  //--------------------------------------------------------------------------------
  // PROBES
  //--------------------------------------------------------------------------------

  async listProbes(): Promise<Probe[]> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/probe/list`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async addProbe(probe: Probe): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/add`,
        data: probe,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async deleteProbe(id: number): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/probe/delete/${id}`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async updateProbe(probe: Probe): Promise<any> {
    console.log('updating probe.', probe);
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update`,
        data: probe,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async resetProbeToken(probe: Probe): Promise<any> {
    console.log('updating probe.', probe);
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update?reset-token=true`,
        data: probe,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  //--------------------------------------------------------------------------------
  // CHECKS
  //--------------------------------------------------------------------------------

  async listChecks(): Promise<Check[]> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/check/list`,
      })
      .then((res: any) => (Array.isArray(res.data) ? res.data : []));
  }

  async addCheck(check: Check): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/add`,
        data: check,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async deleteCheck(id: number): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/check/delete/${id}`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async updateCheck(check: Check): Promise<any> {
    console.log('updating check.', check);
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/update`,
        data: check,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async getTenant(): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({ method: 'GET', url: `${this.instanceSettings.url}/sm/tenant` })
      .then((res: any) => {
        return res.data;
      });
  }

  async disableTenant(): Promise<any> {
    const tenant = await this.getTenant();
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/tenant/update`,
        data: {
          ...tenant,
          status: 1,
        },
      })
      .then((res: any) => {
        return res.data;
      });
  }

  //--------------------------------------------------------------------------------
  // SETUP
  //--------------------------------------------------------------------------------

  normalizeURL(url: string): string {
    if (url.startsWith('http://')) {
      return url;
    } else if (url.startsWith('https://')) {
      return url;
    } else {
      return 'https://' + url;
    }
  }

  async registerInit(apiHost: string, apiToken: string): Promise<RegistrationInfo> {
    const backendSrv = getBackendSrv();
    const data = {
      ...this.instanceSettings,
      jsonData: {
        apiHost: this.normalizeURL(apiHost),
      },
      access: 'proxy',
    };
    await backendSrv.put(`api/datasources/${this.instanceSettings.id}`, data);
    return backendSrv
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/register/init`,
        data: { apiToken },
        headers: {
          // ensure the grafana backend doesn't use a cached copy of the
          // datasource config, as it might not have the new apiHost set.
          'X-Grafana-NoCache': 'true',
        },
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async onOptionsChange(options: SMOptions) {
    const data = {
      ...this.instanceSettings,
      jsonData: options,
      access: 'proxy',
    };
    const info = await getBackendSrv().put(`api/datasources/${this.instanceSettings.id}`, data);
    console.log('updated datasource config', info);
  }

  async registerSave(apiToken: string, options: SMOptions, accessToken: string): Promise<any> {
    const data = {
      ...this.instanceSettings,
      jsonData: options,
      secureJsonData: {
        accessToken,
      },
      access: 'proxy',
    };
    const info = await getBackendSrv().put(`api/datasources/${this.instanceSettings.id}`, data);
    console.log('Saved accessToken, now update our configs', info);

    // Note the accessToken above must be saved first!
    return await getBackendSrv().datasourceRequest({
      method: 'POST',
      url: `${this.instanceSettings.url}/sm/register/save`,
      headers: {
        // ensure the grafana backend doesn't use a cached copy of the
        // datasource config, as it might not have the new accessToken set.
        'X-Grafana-NoCache': 'true',
      },
      data: {
        apiToken,
        metricsInstanceId: options.metrics.hostedId,
        logsInstanceId: options.logs.hostedId,
      },
    });
  }

  async getViewerToken(apiToken: string, instance: HostedInstance): Promise<string> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/register/viewer-token`,
        data: {
          apiToken,
          id: instance.id,
          type: instance.type,
        },
      })
      .then((res: any) => {
        return res.data?.token;
      });
  }

  //--------------------------------------------------------------------------------
  // TEST
  //--------------------------------------------------------------------------------

  async testDatasource() {
    const probes = await this.listProbes();
    if (probes.length) {
      return {
        status: 'OK',
        mesage: `Found ${probes.length} probes`,
      };
    }
    return {
      status: 'Error',
      mesage: 'unable to connect',
    };
  }
}
