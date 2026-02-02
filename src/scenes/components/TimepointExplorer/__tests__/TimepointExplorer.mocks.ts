import { dateTime } from '@grafana/data';

jest.mock('@grafana/scenes-react', () => {
  const actual = jest.requireActual('@grafana/scenes-react');

  const now = Date.now();
  let mockTimeRange = {
    from: dateTime(now - 15 * 60 * 1000),
    to: dateTime(now),
    raw: { from: 'now-15m', to: 'now' },
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
