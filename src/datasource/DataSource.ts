import {
  arrayToDataFrame,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  ScopedVars,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { isArray } from 'lodash';
import { firstValueFrom } from 'rxjs';

import { AdHocCheckResponse, Check, HostedInstance, Probe, ThresholdSettings } from '../types';
import {
  AddCheckResult,
  AddProbeResult,
  DeleteCheckResult,
  DeleteProbeResult,
  ListCheckResult,
  ListProbeResult,
  ListTenantSettingsResult,
  ResetProbeTokenResult,
  UpdateCheckResult,
  UpdateProbeResult,
  UpdateTenantSettingsResult,
} from './responses.types';
import { CheckInfo, QueryType, SMOptions, SMQuery } from './types';
import { findLinkedDatasource, getRandomProbes, queryLogs } from 'utils';

import { parseTracerouteLogs } from './traceroute-utils';

export class SMDataSource extends DataSourceApi<SMQuery, SMOptions> {
  constructor(public instanceSettings: DataSourceInstanceSettings<SMOptions>) {
    super(instanceSettings);
  }

  interpolateVariablesInQueries(queries: SMQuery[], scopedVars: {} | ScopedVars): SMQuery[] {
    const interpolated: SMQuery[] = [];
    const templateSrv = getTemplateSrv();
    queries.forEach((query) => {
      let probe = query.probe ?? '$probe';
      if (!isArray(probe) && probe?.startsWith('$')) {
        probe = templateSrv.replace(probe, scopedVars).replace('{', '').replace('}', '').split(',').join('|');
      }
      if (isArray(probe)) {
        probe = probe.join('|');
      }
      if (probe === '$probe') {
        probe = '.+';
      }

      const job = templateSrv.replace(query.job, scopedVars);
      const instance = templateSrv.replace(query.instance, scopedVars);

      interpolated.push({
        ...query,
        job,
        instance,
        probe,
      });
    });
    return interpolated;
  }

  getMetricsDS() {
    const info = this.instanceSettings.jsonData.metrics;
    const ds = findLinkedDatasource({ ...info, uid: 'grafanacloud-metrics' });
    if (ds) {
      return ds;
    }
    return findLinkedDatasource(info);
  }

  getLogsDS() {
    const info = this.instanceSettings.jsonData.logs;
    const ds = findLinkedDatasource({ ...info, uid: 'grafanacloud-logs' });
    if (ds) {
      return ds;
    }
    return findLinkedDatasource(this.instanceSettings.jsonData.logs);
  }

  async query(options: DataQueryRequest<SMQuery>): Promise<DataQueryResponse> {
    const data: DataFrame[] = [];
    const interpolated = this.interpolateVariablesInQueries(options.targets, options.scopedVars);
    for (const query of interpolated) {
      if (query.queryType === QueryType.Probes) {
        const probes = await this.listProbes();
        const frame = arrayToDataFrame(
          probes.map((probe) => {
            return {
              ...probe,
              onlineChange: probe.onlineChange * 1000,
              created: probe.created ?? 0 * 1000,
              modified: probe.modified ?? 0 * 1000,
            };
          })
        );
        frame.refId = query.refId;
        // frame.setFieldType('onlineChange', FieldType.time, (s) => (s as number) * 1000); // seconds to ms
        // frame.setFieldType('created', FieldType.time, (s) => (s as number) * 1000); // seconds to ms
        // frame.setFieldType('modified', FieldType.time, (s) => (s as number) * 1000); // seconds to ms
        // frame.refId = query.refId;
        data.push(frame);
      } else if (query.queryType === QueryType.Checks) {
        const checks = await this.listChecks();
        const frame = arrayToDataFrame(
          checks.map((check) => {
            return {
              ...check,
              created: check.created ?? 0 * 1000, // seconds to ms
              modified: check.modified ?? 0 * 1000, // seconds to ms
            };
          })
        );
        // frame.setFieldType('created', FieldType.time, (s) => (s as number) * 1000); // seconds to ms
        // frame.setFieldType('modified', FieldType.time, (s) => (s as number) * 1000); // seconds to ms
        frame.refId = query.refId;

        const copy: DataFrame = {
          ...frame,
          fields: frame.fields,
          length: checks.length,
        };

        data.push(copy);
      } else if (query.queryType === QueryType.Traceroute) {
        const logsUrl = this.getLogsDS()?.url;
        if (!logsUrl) {
          return {
            data: [],
            error: {
              data: {
                message: 'Could not find a Loki datasource',
              },
            },
          };
        }

        if (!query.job || !query.instance) {
          return {
            data: [],
            error: {
              data: {
                message: 'A check must be selected',
              },
            },
          };
        }

        const finalQuery = `{probe=~"${query.probe ?? '.+'}", job="${query.job}", instance="${
          query.instance
        }", check_name="traceroute"} | logfmt`;

        const response = await queryLogs(this.getLogsDS()?.uid ?? '', finalQuery, options.range);

        const dataFrames = parseTracerouteLogs(response);

        return { data: dataFrames };
      }
    }
    return { data };
  }

  getProbeValueFromVar(probe: string | string[] | undefined): string {
    const allProbes = '.+';
    const isArray = Array.isArray(probe);

    if (!probe || (!isArray && (!probe || probe === '$__all'))) {
      return allProbes;
    }
    if (isArray && probe.length > 1) {
      return (probe as string[]).join('|');
    } else if (isArray && probe.length === 1) {
      if (!probe[0] || probe[0] === '$__all') {
        return allProbes;
      }
      return probe[0];
    }

    return allProbes;
  }

  async getCheckInfo(): Promise<CheckInfo> {
    return getBackendSrv()
      .fetch({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/checks/info`,
      })
      .toPromise()
      .then((res: any) => {
        return res.data as CheckInfo;
      });
  }

  //--------------------------------------------------------------------------------
  // PROBES
  //--------------------------------------------------------------------------------

  async listProbes() {
    return firstValueFrom(
      getBackendSrv().fetch<ListProbeResult>({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/probe/list`,
      })
    ).then((res) => res.data);
  }

  async addProbe(probe: Probe) {
    return firstValueFrom(
      getBackendSrv().fetch<AddProbeResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/add`,
        data: probe,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async updateProbe(probe: Probe) {
    return firstValueFrom(
      getBackendSrv().fetch<UpdateProbeResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update`,
        data: probe,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async deleteProbe(id: number) {
    return firstValueFrom(
      getBackendSrv().fetch<DeleteProbeResult>({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/probe/delete/${id}`,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async resetProbeToken(probe: Probe) {
    return firstValueFrom(
      getBackendSrv().fetch<ResetProbeTokenResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/probe/update?reset-token=true`,
        data: probe,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async metricFindQuery(query: string, options?: any): Promise<MetricFindValue[]> {
    const checks = await this.listChecks();
    const metricFindValues = checks.map<MetricFindValue>((check) => {
      const value = `${check.job}: ${check.target}`;
      return {
        value,
        text: value,
      };
    });
    return metricFindValues;
  }

  //--------------------------------------------------------------------------------
  // CHECKS
  //--------------------------------------------------------------------------------

  async listChecks() {
    return firstValueFrom(
      getBackendSrv().fetch<ListCheckResult>({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/check/list`,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async getCheck(checkId: number) {
    return firstValueFrom(
      getBackendSrv().fetch<Check>({
        method: `GET`,
        url: `${this.instanceSettings.url}/sm/check/${checkId}`,
      })
    ).then((res) => res.data);
  }

  async testCheck(check: Check) {
    const randomSelection = getRandomProbes(check.probes, 5);
    check.probes = randomSelection;

    return firstValueFrom(
      getBackendSrv().fetch<AdHocCheckResponse>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/adhoc`,
        data: check,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async addCheck(check: Check) {
    return firstValueFrom(
      getBackendSrv().fetch<AddCheckResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/add`,
        data: check,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async deleteCheck(id: number) {
    return firstValueFrom(
      getBackendSrv().fetch<DeleteCheckResult>({
        method: 'DELETE',
        url: `${this.instanceSettings.url}/sm/check/delete/${id}`,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async updateCheck(check: Check) {
    return firstValueFrom(
      getBackendSrv().fetch<UpdateCheckResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/update`,
        data: check,
      })
    ).then((res) => {
      return res.data;
    });
  }

  async bulkUpdateChecks(checks: Check[]): Promise<boolean> {
    return firstValueFrom(
      getBackendSrv().fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/check/update/bulk`,
        data: checks,
      })
    ).then((res: any) => {
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

  async getTenantSettings() {
    return firstValueFrom(
      getBackendSrv().fetch<ListTenantSettingsResult>({
        method: 'GET',
        url: `${this.instanceSettings.url}/sm/tenant/settings`,
      })
    ).then((res) => res.data);
  }

  async updateTenantSettings(settings: { thresholds: ThresholdSettings }) {
    return firstValueFrom(
      getBackendSrv().fetch<UpdateTenantSettingsResult>({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/tenant/settings/update`,
        data: {
          ...settings,
        },
      })
    ).then((res) => {
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

  onOptionsChange = async (options: SMOptions) => {
    const data = {
      ...this.instanceSettings,
      jsonData: options,
      access: 'proxy',
    };
    await getBackendSrv().put(`api/datasources/${this.instanceSettings.id}`, data);
  };

  async registerSave(apiToken: string, options: SMOptions, accessToken: string): Promise<any> {
    const data = {
      ...this.instanceSettings,
      jsonData: options,
      secureJsonData: {
        accessToken,
      },
      access: 'proxy',
    };
    await getBackendSrv().put(`api/datasources/${this.instanceSettings.id}`, data);

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

  async createApiToken(): Promise<string> {
    return getBackendSrv()
      .fetch({
        method: 'POST',
        url: `${this.instanceSettings.url}/sm/token/create`,
        data: {},
      })
      .toPromise()
      .then((res: any) => res.data?.token);
  }

  //--------------------------------------------------------------------------------
  // TEST
  //--------------------------------------------------------------------------------

  async testDatasource() {
    const probes = await this.listProbes();
    if (probes.length) {
      return {
        status: 'OK',
        message: `Found ${probes.length} probes`,
      };
    }
    return {
      status: 'Error',
      message: 'unable to connect',
    };
  }
}
