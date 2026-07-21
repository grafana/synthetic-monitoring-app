import React from 'react';
import { render, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { FeatureName } from 'types';

import { HttpDashboardRoute } from './HttpDashboardRoute';

jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn((name: FeatureName) => ({
    isEnabled: name === FeatureName.SceneFreeHttpDashboard ? false : false,
    isReady: true,
  })),
}));

jest.mock('scenes/HTTP/HttpDashboard', () => ({
  HttpDashboard: ({ check }: { check: { job: string } }) => (
    <div data-testid="legacy-http-dashboard">{check.job}</div>
  ),
}));

jest.mock('dashboards/http/SceneFreeHttpDashboard', () => ({
  SceneFreeHttpDashboard: ({ check }: { check: { job: string } }) => (
    <div data-testid="scene-free-http-dashboard">{check.job}</div>
  ),
}));

describe('HttpDashboardRoute', () => {
  it('renders the legacy Scene HTTP dashboard when the feature flag is off', () => {
    render(<HttpDashboardRoute check={BASIC_HTTP_CHECK} />);

    expect(screen.getByTestId('legacy-http-dashboard')).toHaveTextContent(BASIC_HTTP_CHECK.job);
  });
});
