import React from 'react';
import * as runtime from '@grafana/runtime';

export const getBackendSrv = () => ({
  fetch: {
    toPromise: () => jest.fn().mockResolvedValue({ ok: true }),
  },
  request: () => jest.fn().mockResolvedValue({ ok: true }),
});

export const getLocationSrv = () => ({
  update: (args) => args,
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
    featureToggles: {
      ...runtime.config.featureToggles,
      topnav: true,
    },
  },
  getBackendSrv,
  getLocationSrv,
  PluginPage,
};
