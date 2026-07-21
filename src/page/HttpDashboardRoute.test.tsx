import React from 'react';
import { render, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { HttpDashboardRoute } from './HttpDashboardRoute';

jest.mock('scenes/HTTP/HttpDashboard', () => ({
  HttpDashboard: ({ check }: { check: { job: string } }) => (
    <div data-testid="legacy-http-dashboard">{check.job}</div>
  ),
}));

describe('HttpDashboardRoute', () => {
  it('renders the legacy Scene HTTP dashboard for the check', () => {
    render(<HttpDashboardRoute check={BASIC_HTTP_CHECK} />);

    expect(screen.getByTestId('legacy-http-dashboard')).toHaveTextContent(BASIC_HTTP_CHECK.job);
  });
});
