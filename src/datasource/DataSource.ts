import {
  arrayToDataFrame,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  ScopedVars,
  TimeRange,
} from '@grafana/data';
import { BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { isArray } from 'lodash';
import { firstValueFrom } from 'rxjs';

import { Check, CheckAlertDraft, Probe, ThresholdSettings } from '../types';
import {
  AccessTokenResponse,
  AddCheckResult,
  type AddProbeResult,
  AdHocCheckResponse,
  CheckAlertsResponse,
  CheckInfoResult,
  DeleteCheckResult,
  DeleteProbeResult,
  ListCheckResult,
  ListProbeResult,
  ListTenantLimitsResponse,
  ListTenantSettingsResult,
  LogsQueryResponse,
  type ResetProbeTokenResult,
  TenantResponse,
  UpdateCheckResult,
  type UpdateProbeResult,
  type UpdateTenantSettingsResult,
} from './responses.types';
import { QueryType, SMOptions, SMQuery } from './types';
import { findLinkedDatasource, getRandomProbes, queryLogs } from 'utils';
import { ExtendedBulkUpdateCheckResult } from 'data/useChecks';
import { ExperimentalSecret, ExperimentalSecretsResponse } from 'data/useSecrets';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { secretsApiStub } from './secretsApiStub';
import { parseTracerouteLogs } from './traceroute-utils';

export class SMDataSource extends DataSourceApi<SMQuery, SMOptions> {
  constructor(public instanceSettings: DataSourceInstanceSettings<SMOptions>) {
    super(instanceSettings);
  }

  async fetchAPI<T>(url: BackendSrvRequest['url'], options?: Omit<BackendSrvRequest, 'url'>) {
    const response = await firstValueFrom(
      getBackendSrv().fetch<T>({
        method: options?.method ?? 'GET',
        url,
        ...options,
      })
    ).catch((error: unknown) => {
      // We could log the error here

      throw error;
    });

    return response?.data as T;
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

  // these are assumptions which may not hold true in all cases
  // see https://github.com/grafana/synthetic-monitoring-app/pull/911 for more details
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

  async getCheckInfo() {
    return this.fetchAPI<CheckInfoResult>(`${this.instanceSettings.url}/sm/checks/info`);
  }

  async queryLogs(expr: string, range: TimeRange) {
    return this.fetchAPI<LogsQueryResponse>(`/api/ds/query`, {
      method: 'POST',
      data: {
        queries: [
          {
            refId: 'A',
            expr,
            queryType: 'range',
            datasource: this.instanceSettings.jsonData.logs,
            intervalMs: 2000,
            maxDataPoints: 1779,
          },
        ],
        from: String(range.from.unix() * 1000),
        to: String(range.to.unix() * 1000),
      },
    }).then((data) => data.results.A.frames);
  }

  //--------------------------------------------------------------------------------
  // PROBES
  //--------------------------------------------------------------------------------

  async listProbes() {
    return this.fetchAPI<ListProbeResult>(`${this.instanceSettings.url}/sm/probe/list`);
  }

  async addProbe(probe: Probe) {
    return this.fetchAPI<AddProbeResult>(`${this.instanceSettings.url}/sm/probe/add`, {
      method: 'POST',
      data: probe,
    });
  }

  async updateProbe(probe: Probe) {
    return this.fetchAPI<UpdateProbeResult>(`${this.instanceSettings.url}/sm/probe/update`, {
      method: 'POST',
      data: probe,
    });
  }

  async resetProbeToken(probe: Probe) {
    return this.fetchAPI<ResetProbeTokenResult>(`${this.instanceSettings.url}/sm/probe/update?reset-token=true`, {
      method: 'POST',
      data: probe,
    });
  }

  async deleteProbe(id: number) {
    return this.fetchAPI<DeleteProbeResult>(`${this.instanceSettings.url}/sm/probe/delete/${id}`, { method: 'DELETE' });
  }

  //--------------------------------------------------------------------------------
  // CHECKS
  //--------------------------------------------------------------------------------

  async listChecks() {
    return this.fetchAPI<ListCheckResult>(`${this.instanceSettings.url}/sm/check/list`);
  }

  async getCheck(checkId: number) {
    return this.fetchAPI<Check>(`${this.instanceSettings.url}/sm/check/${checkId}`);
  }

  async testCheck(check: Check) {
    const payload = getTestPayload(check);
    return this.fetchAPI<AdHocCheckResponse>(`${this.instanceSettings.url}/sm/check/adhoc`, {
      method: 'POST',
      data: payload,
    });
  }

  async addCheck(check: Check) {
    return this.fetchAPI<AddCheckResult>(`${this.instanceSettings.url}/sm/check/add`, {
      method: 'POST',
      data: check,
    });
  }

  async deleteCheck(id: number) {
    return this.fetchAPI<DeleteCheckResult>(`${this.instanceSettings.url}/sm/check/delete/${id}`, { method: 'DELETE' });
  }

  async updateCheck(check: Check) {
    return this.fetchAPI<UpdateCheckResult>(`${this.instanceSettings.url}/sm/check/update`, {
      method: 'POST',
      data: check,
    });
  }

  async bulkUpdateChecks(checks: Check[]) {
    return this.fetchAPI<ExtendedBulkUpdateCheckResult>(`${this.instanceSettings.url}/sm/check/update/bulk`, {
      method: 'POST',
      data: checks,
    });
  }

  async getTenant() {
    return this.fetchAPI<TenantResponse>(`${this.instanceSettings.url}/sm/tenant`);
  }

  async getTenantLimits() {
    return this.fetchAPI<ListTenantLimitsResponse>(`${this.instanceSettings.url}/sm/tenant/limits`);
  }

  async getTenantSettings() {
    return this.fetchAPI<ListTenantSettingsResult>(`${this.instanceSettings.url}/sm/tenant/settings`);
  }

  async updateTenantSettings(settings: { thresholds: ThresholdSettings }) {
    return this.fetchAPI<UpdateTenantSettingsResult>(`${this.instanceSettings.url}/sm/tenant/settings/update`, {
      method: 'POST',
      data: {
        ...settings,
      },
    });
  }

  async disableTenant(): Promise<any> {
    const tenant = await this.getTenant();
    return this.fetchAPI(`${this.instanceSettings.url}/sm/tenant/update`, {
      method: 'POST',
      data: {
        ...tenant,
        status: 1,
      },
    });
  }

  //--------------------------------------------------------------------------------
  // ALERTS PER CHECK
  //--------------------------------------------------------------------------------
  // Note: this endpoints are not yet released. The prototype can be seen here https://github.com/grafana/synthetic-monitoring-api/pull/992

  async listAlertsForCheck(checkId: number) {
    return this.fetchAPI<CheckAlertsResponse>(`${this.instanceSettings.url}/sm/check/${checkId}/alerts`);
  }

  async updateAlertsForCheck(alerts: CheckAlertDraft[], checkId: number) {
    return this.fetchAPI<CheckAlertsResponse>(`${this.instanceSettings.url}/sm/check/${checkId}/alerts`, {
      method: 'PUT',
      data: { alerts },
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

  async createApiToken(): Promise<string> {
    return this.fetchAPI<AccessTokenResponse>(`${this.instanceSettings.url}/sm/token/create`, {
      method: 'POST',
      data: {},
    }).then((data) => data.token);
  }

  //--------------------------------------------------------------------------------
  // SECRETS MANAGEMENT - NOT YET IMPLEMENTED
  //--------------------------------------------------------------------------------

  async getSecrets(): Promise<ExperimentalSecretsResponse> {
    return secretsApiStub.get('/secrets');
  }

  async getSecret(id: string | number): Promise<ExperimentalSecret> {
    return secretsApiStub.get<ExperimentalSecret>(`/secrets/${id}`);
  }

  async saveSecret(secret: SecretFormValues & { uuid?: string }): Promise<ExperimentalSecret> {
    if (secret.uuid) {
      return secretsApiStub.put(`/secrets/${secret.uuid}`, secret);
    }

    return secretsApiStub.post('/secrets', secret);
  }

  async deleteSecret(id: string | number): Promise<unknown> {
    return secretsApiStub.delete(`/secrets/${id}`);
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

function getTestPayload(check: Check) {
  const randomSelection = getRandomProbes(check.probes, 5);

  if (check.id) {
    const { id, ...rest } = check;
    return {
      ...rest,
      probes: randomSelection,
    };
  }

  return {
    ...check,
    probes: randomSelection,
  };
}
