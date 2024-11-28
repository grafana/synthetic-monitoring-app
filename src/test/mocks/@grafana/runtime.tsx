import React, { ReactNode } from 'react';
import { NavModelItem, OrgRole } from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';
import axios from 'axios';
import { from } from 'rxjs';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { FULL_ADMIN_ACCESS } from 'test/fixtures/rbacPermissions';

import { SMDataSource } from 'datasource/DataSource';

import { DataTestIds } from '../../dataTestIds';

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
      },
      bootData: {
        user: {
          ...actual.config.user,
          orgRole: OrgRole.Admin,
          permissions: FULL_ADMIN_ACCESS,
        },
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
      getList: () => [METRICS_DATASOURCE, LOGS_DATASOURCE, SM_DATASOURCE],
      get: () => Promise.resolve(new SMDataSource(SM_DATASOURCE)),
    }),
    getLocationSrv: () => ({
      update: (args: any) => args,
    }),
    PluginPage: ({ actions, children, pageNav }: { actions: any; children: ReactNode; pageNav: NavModelItem }) => {
      return (
        <div>
          <h2>{pageNav?.text}</h2>
          <div>{actions}</div>
          {children}
          <div data-testid={DataTestIds.CONFIG_PAGE_LAYOUT_ACTIVE_TAB}>
            {pageNav?.children?.find((child) => child.active)?.text ?? 'No active tab'}
          </div>
        </div>
      );
    },
  };
});
