/* eslint-disable simple-import-sort/imports */
// Jest setup provided by Grafana scaffolding
import '../../.config/jest-setup';
import React from 'react';
import { BackendSrvRequest } from '@grafana/runtime';
import { OrgRole } from '@grafana/data';
import { server } from './server';
import axios from 'axios';
import { from } from 'rxjs';

import { instanceSettings } from '../datasource/__mocks__/DataSource';
import { SMDataSource } from '../datasource/DataSource';

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

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
      featureToggles: {
        ...actual.config.featureToggles,
        topnav: true,
      },
    },
    getBackendSrv: () => ({
      datasourceRequest: axios.request,
      fetch: (request: BackendSrvRequest) => {
        if (request.method?.toUpperCase() === 'POST') {
          return from(
            axios.post(request.url, request.data)
          )
        }

        return from(
          axios.request(request).catch((e) => {
            console.log(e);
            const error = new Error(e.message);
            // // @ts-expect-error Match error format with backendsrv
            // error.data = e.response.data;
            // // @ts-expect-error Match error format with backendsrv
            // error.status = e.response.status;

            throw error;
          })
        );
      },
    }),
    getDataSourceSrv: () => ({
      get: () => {
        return Promise.resolve(new SMDataSource(instanceSettings));
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
