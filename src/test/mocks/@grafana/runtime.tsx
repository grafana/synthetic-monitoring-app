import React from 'react';
import { BackendSrvRequest } from '@grafana/runtime';
import axios from 'axios';
import { from } from 'rxjs';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';

import { SMDataSource } from 'datasource/DataSource';

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  return {
    ...actual,
    config: {
      ...actual.config,
      datasources: {
        [METRICS_DATASOURCE.name]: METRICS_DATASOURCE,
        [LOGS_DATASOURCE.name]: LOGS_DATASOURCE,
      },
      featureToggles: {
        ...actual.config.featureToggles,
        topnav: true,
      },
    },
    getBackendSrv: () => ({
      datasourceRequest: axios.request,
      fetch: (request: BackendSrvRequest) => {
        return from(
          axios
            .request({
              ...request,
              method: request.method,
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
          return Promise.resolve(new SMDataSource(SM_DATASOURCE));
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
