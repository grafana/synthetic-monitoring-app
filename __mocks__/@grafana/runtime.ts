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

export const config = {
  theme: {},
};

module.exports = {
  ...runtime,
  getBackendSrv,
  getLocationSrv,
};
