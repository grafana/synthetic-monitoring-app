jest.mock('@grafana/scenes-react', () => {
  const actual = jest.requireActual('@grafana/scenes-react');

  const fromDate = new Date('2024-01-01T00:00:00Z');
  const toDate = new Date('2024-01-02T00:00:00Z');

  let mockTimeRange = {
    from: {
      ...fromDate,
      toDate: () => fromDate,
      valueOf: () => fromDate.valueOf(),
    },
    to: {
      ...toDate,
      toDate: () => toDate,
      valueOf: () => toDate.valueOf(),
    },
    raw: { from: 'now-1d', to: 'now' },
  };

  // Provide a default 'probe' variable so useSceneVar/useSceneVarProbes don't touch SceneContext
  let mockVariables = [{ state: { name: 'probe', value: ['$__all'] as string[] } }];

  return {
    ...actual,
    useTimeRange: jest.fn(() => [mockTimeRange, jest.fn()]),
    useVariables: jest.fn(() => mockVariables),
  };
});

jest.mock('scenes/Common/useSceneRefreshPicker', () => ({
  useSceneRefreshPicker: jest.fn(() => null),
}));

jest.mock('scenes/Common/useSceneAnnotation', () => ({
  useSceneAnnotation: jest.fn(() => []),
}));

test.skip(`should inherit the mocks...`, () => {});
