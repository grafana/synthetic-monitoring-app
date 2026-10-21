import React from 'react';
import { screen, within } from '@testing-library/react';
import { MOCK_MULTI_TREE_ROUTE_MATCH } from 'test/fixtures/alerting';
import { render } from 'test/render';

import { RouteTreeDisplay } from './RouteTreeDisplay';

describe('RouteTreeDisplay', () => {
  it('keeps roots with the same route ID separate and links each policy tree correctly', async () => {
    render(<RouteTreeDisplay routeMatch={MOCK_MULTI_TREE_ROUTE_MATCH} />);
    const tree = await screen.findByRole('list', { name: 'Matched notification policies' });
    expect(within(tree).getByRole('link', { name: 'Default policy' })).toHaveAttribute(
      'href',
      '/alerting/routes/policy/user-defined/edit?alertmanager=grafana'
    );
    expect(within(tree).getByRole('link', { name: 'hashicorp-vault' })).toHaveAttribute(
      'href',
      '/alerting/routes/policy/hashicorp-vault/edit?alertmanager=grafana'
    );
    expect(within(tree).getByRole('link', { name: 'pam-incident-alert' })).toHaveAttribute(
      'href',
      '/alerting/routes/policy/pam-incident-alert/edit?alertmanager=grafana'
    );
    expect(within(tree).getByRole('link', { name: 'label_Environment=prod' })).toBeInTheDocument();
    expect(within(tree).getByRole('link', { name: 'PAM Incident Alert' })).toBeInTheDocument();
    expect(within(tree).getAllByText('Routes to')).toHaveLength(1);
  });

  it('explains when no routes matched', async () => {
    render(<RouteTreeDisplay routeMatch={{ matchedRoutes: [] }} />);
    expect(await screen.findByText('No routing information available.')).toBeInTheDocument();
  });
});
