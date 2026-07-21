import { dateTime } from '@grafana/data';

const mockTimeRange = {
  from: dateTime(Date.now() - 15 * 60 * 1000),
  to: dateTime(Date.now()),
  raw: { from: 'now-15m', to: 'now' },
};

jest.mock('dashboards/hooks/useDashboardTime', () => ({
  useDashboardTime: jest.fn(() => mockTimeRange),
}));

jest.mock('dashboards/hooks/useDashboardVar', () => ({
  useDashboardVar: jest.fn(() => ['.*']),
  useDashboardVarProbes: jest.fn(() => ['atlanta']),
  formatDashboardProbeMatcher: jest.fn(() => '.*'),
}));

jest.mock('dashboards/hooks/useDashboardRefresh', () => ({
  useDashboardRefresh: jest.fn(() => null),
}));

jest.mock('dashboards/annotations/DashboardAnnotationsProvider', () => ({
  useDashboardAnnotationEventsForTpe: jest.fn(() => ({ firing: [], pending: [] })),
  useDashboardAnnotationFrames: jest.fn(() => []),
  useDashboardAnnotationsOptional: jest.fn(() => null),
}));

test.skip(`should inherit the mocks...`, () => {});
