export const getBackendSrv = () => ({
  datasourceRequest: jest.fn().mockImplementation(() => ({ ok: true })),
});

export const config = {
  theme: {},
};
