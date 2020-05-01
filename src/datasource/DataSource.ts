import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  ArrayDataFrame,
  DataFrame,
} from '@grafana/data';

import { WorldpingQuery, WorldpingOptions, QueryType } from './types';

import { getBackendSrv } from '@grafana/runtime';
import { Probe, Check, RegistrationInfo, HostedInstance } from '../types';

export class WorldPingDataSource extends DataSourceApi<WorldpingQuery, WorldpingOptions> {
  constructor(public instanceSettings: DataSourceInstanceSettings<WorldpingOptions>) {
    super(instanceSettings);
  }

  async query(options: DataQueryRequest<WorldpingQuery>): Promise<DataQueryResponse> {
    const data: DataFrame[] = [];
    for (const query of options.targets) {
      if (query.queryType === QueryType.Probes) {
        const probes = await this.listProbes();
        const frame = new ArrayDataFrame(probes);
        frame.setFieldType('onelineChange', FieldType.time, (s: number) => s * 1000); // seconds to ms
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
      .datasourceRequest({
        method: 'GET',
        url: `${this.instanceSettings.url}/dev/probe/list`,
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
        url: `${this.instanceSettings.url}/dev/check/list`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async addCheck(check: Check): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/dev/check/add`,
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
        url: `${this.instanceSettings.url}/dev/check/${id}`,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async updateCheck(check: Check): Promise<any> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'PUT',
        url: `${this.instanceSettings.url}/dev/check/${check.id}`,
        data: check,
      })
      .then((res: any) => {
        return res.data;
      });
  }

  //--------------------------------------------------------------------------------
  // SETUP
  //--------------------------------------------------------------------------------

  async registerInit(apiToken: string): Promise<RegistrationInfo> {
    return getBackendSrv()
      .datasourceRequest({
        method: 'POST',
        url: `${this.instanceSettings.url}/dev/register/init`,
        data: { apiToken },
      })
      .then((res: any) => {
        return res.data;
      });
  }

  async registerSave(apiToken: string, options: WorldpingOptions, accessToken: string): Promise<any> {
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
      url: `${this.instanceSettings.url}/dev/register/save`,
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
        url: `${this.instanceSettings.url}/dev/register/viewer-token`,
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
