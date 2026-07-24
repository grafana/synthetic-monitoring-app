import React from 'react';
import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardProvider, useCheckDashboard } from './CheckDashboardProvider';

function CheckContextConsumer() {
  const context = useCheckDashboard();

  return (
    <div
      data-check-job={context.check.job}
      data-context-keys={Object.keys(context).sort().join(',')}
      data-testid="check-context"
      data-url-format={context.urlFormat}
    />
  );
}

describe('CheckDashboardProvider', () => {
  it('exposes check identity and URL format without probe filter state', () => {
    render(
      <MemoryRouter>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <CheckContextConsumer />
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    const context = screen.getByTestId('check-context');
    expect(context).toHaveAttribute('data-check-job', BASIC_HTTP_CHECK.job);
    expect(context).toHaveAttribute('data-context-keys', 'check,urlFormat');
    expect(context).toHaveAttribute('data-url-format', 'canonical');
  });
});

describe('HTTP dashboard route', () => {
  it('mounts CheckDashboardProvider on the HTTP dashboard', () => {
    jest.isolateModules(() => {
      const { HTTPDashboard } = require('dashboards/http/HTTPDashboard');
      const routeSource = HTTPDashboard.toString();

      expect(routeSource).toContain('CheckDashboardProvider');
    });
  });
});
