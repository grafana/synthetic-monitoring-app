import React from 'react';
import { OrgRole } from '@grafana/data';
import * as runtime from '@grafana/runtime';

export const getBackendSrv = () => ({
  fetch: {
    toPromise: () => jest.fn().mockResolvedValue({ ok: true }),
  },
  request: () => jest.fn().mockResolvedValue({ ok: true }),
});

export const getLocationSrv = () => ({
  update: (args: any) => args,
});

function PluginPage({ actions, children, pageNav }: any) {
  return (
    <div>
      <h2>{pageNav?.text}</h2>
      <div>{actions}</div>
      {children}
    </div>
  );
}

module.exports = {
  ...runtime,
  config: {
    ...runtime.config,
    bootData: {
      ...runtime.config.bootData,
      user: {
        ...runtime.config.bootData.user,
        orgRole: OrgRole.Editor,
      },
    },
    featureToggles: {
      ...runtime.config.featureToggles,
      topnav: true,
    },
  },
  getBackendSrv,
  getLocationSrv,
  PluginPage,
};
