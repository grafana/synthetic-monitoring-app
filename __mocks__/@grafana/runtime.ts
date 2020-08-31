export const getBackendSrv = () => ({
  datasourceRequest: jest.fn().mockImplementation(() => ({ ok: true })),
});

export const getLocationSrv = () => ({
  update: args => args,
});

export const config = {
  theme: {},
};
