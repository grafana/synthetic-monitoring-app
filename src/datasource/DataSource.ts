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

export class SMDataSource extends DataSourceApi<SMQuery, SMOptions> {
  constructor(public instanceSettings: DataSourceInstanceSettings<SMOptions>) {
    super(instanceSettings);
  }

  getMetricsDS() {
    return config.datasources[this.instanceSettings.jsonData.metrics.grafanaName];
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
      }
    }
    return { data };
  }

  //--------------------------------------------------------------------------------
  // PROBES
  //--------------------------------------------------------------------------------

  async listProbes(): Promise<Probe[]> {
    return getBackendSrv()
      .fetch({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/probe/list`,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async addProbe(probe: Probe): Promise<any> {
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/add`,
        data: probe,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async deleteProbe(id: number): Promise<any> {
    return getBackendSrv()
      .fetch({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/probe/delete/${id}`,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async updateProbe(probe: Probe): Promise<any> {
    console.log('updating probe.', probe);
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update`,
        data: probe,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async resetProbeToken(probe: Probe): Promise<any> {
    console.log('updating probe.', probe);
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update?reset-token=true`,
        data: probe,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  //--------------------------------------------------------------------------------
  // CHECKS
  //--------------------------------------------------------------------------------

  async listChecks(): Promise<Check[]> {
    return getBackendSrv()
      .fetch({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/check/list`,
      })
      .toPromise()
      .then((res: any) => (Array.isArray(res.data) ? res.data : []));
  }

  async addCheck(check: Check): Promise<any> {
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/add`,
        data: check,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async deleteCheck(id: number): Promise<any> {
    return getBackendSrv()
      .fetch({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/check/delete/${id}`,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async updateCheck(check: Check): Promise<any> {
    console.log('updating check.', check);
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/update`,
        data: check,
      })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async getTenant(): Promise<any> {
    return getBackendSrv()
      .fetch({ method: 'GET', url: `${this.instanceSettings.url}/sm/tenant` })
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  async disableTenant(): Promise<any> {
    const tenant = await this.getTenant();
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/tenant/update`,
        data: {
          ...tenant,
          status: 1,
        },
      })
      .toPromise()
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
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/register/init`,
        data: { apiToken },
        headers: {
          // ensure the grafana backend doesn't use a cached copy of the
          // datasource config, as it might not have the new apiHost set.
          'X-Grafana-NoCache': 'true',
        },
      })
      .toPromise()
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
    return await getBackendSrv().fetch({
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
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/register/viewer-token`,
        data: {
          apiToken,
          id: instance.id,
          type: instance.type,
        },
      })
      .toPromise()
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
