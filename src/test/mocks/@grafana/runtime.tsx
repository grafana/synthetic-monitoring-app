import React from 'react';
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  OrgRole,
  PluginType,
  TestDataSourceResponse,
} from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';
import { DataQuery, LoadingState } from '@grafana/schema';
import axios, { Method } from 'axios';
import { from } from 'rxjs';
import { LogsDSSettings, MetricsDSSettings, SMDSSettings } from 'test/fixtures/datasources';

import { SMDataSource } from 'datasource/DataSource';

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  return {
    ...actual,
    config: {
      ...actual.config,
      bootData: {
        ...actual.config.bootData,
        user: {
          ...actual.config.bootData.user,
          orgRole: OrgRole.Editor,
        },
      },
      datasources: [MetricsDSSettings, LogsDSSettings],
      featureToggles: {
        ...actual.config.featureToggles,
        topnav: true,
        ngalert: true, // FeatureName.UnifiedAlerting
        'multi-http': true, // FeatureName.MultiHttp
        syntheticsPerCheckDashboards: true, // FeatureName.PerCheckDashboards
      },
    },
    getBackendSrv: () => ({
      datasourceRequest: axios.request,
      fetch: (request: BackendSrvRequest) => {
        return from(
          axios
            .request({
              ...request,
              method: request.method as Method,
            })
            .catch((e) => {
              const error = new Error(e.message);
              // @ts-expect-error Match error format with backendsrv
              error.data = e.response.data;
              // @ts-expect-error Match error format with backendsrv
              error.status = e.response.status;

              throw error;
            })
        );
      },
    }),
    getDataSourceSrv: () => ({
      get: (name: string) => {
        if (name === `Synthetic Monitoring`) {
          return Promise.resolve(new SMDataSource(SMDSSettings));
        }

        if (name === `Synthetic Monitoring Metrics`) {
          return Promise.resolve(
            new FakeMetricsDS({
              name: SMDSSettings.jsonData.metrics.grafanaName,
              url: `/metrics`,
              id: SMDSSettings.jsonData.metrics.hostedId,
              type: `prometheus`,
            })
          );
        }

        if (name === `Synthetic Monitoring Logs`) {
          return Promise.resolve(
            new FakeMetricsDS({
              name: SMDSSettings.jsonData.logs.grafanaName,
              url: `/logs/`,
              id: SMDSSettings.jsonData.logs.hostedId,
              type: `loki`,
            })
          );
        }

        throw new Error(`Requested unknown datasource: ${name}`);
      },
    }),
    getLocationSrv: () => ({
      update: (args: any) => args,
    }),
    PluginPage: ({ actions, children, pageNav }: any) => {
      return (
        <div>
          <h2>{pageNav?.text}</h2>
          <div>{actions}</div>
          {children}
        </div>
      );
    },
  };
});

class FakeMetricsDS extends DataSourceApi {
  constructor(info: any) {
    super({
      name: info.name,
      url: info.url,
      id: info.id,
      type: info.type,
      uid: info.uid,
      readOnly: false,
      meta: {
        id: info.id.toString(),
        name: info.name,
        type: PluginType.datasource,
        module: ``,
        baseUrl: ``,
        info: {
          author: {
            url: ``,
            name: ``,
          },
          description: `fake logs`,
          links: [],
          screenshots: [],
          updated: ``,
          version: `1.0.0`,
          logos: {
            large: `/logos/large.png`,
            small: `/logos/small.png`,
          },
        },
      },
      jsonData: {},
      access: `proxy`,
    });
  }

  query(options: DataQueryRequest<DataQuery>): Promise<DataQueryResponse> {
    return Promise.resolve({
      data: [],
      key: ``,
      state: LoadingState.Done,
    });
  }

  testDatasource(): Promise<TestDataSourceResponse> {
    return Promise.resolve({
      status: `OK`,
      message: `Good test`,
    });
  }
}
