jest.mock('@grafana/assistant', () => ({
  useProvidePageContext: jest.fn(() => jest.fn()),
  createAssistantContextItem: jest.fn((type, params) => ({ type, ...params })),
}));
