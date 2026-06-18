import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  MOCK_HTTP_DURATION_ROUTE_MATCH,
  MOCK_MULTI_TREE_ROUTE_MATCH,
  MOCK_PROBE_FAILED_ROUTE_MATCH,
} from '../../../test/fixtures/alerting';
import { RouteTreeDisplay } from './RouteTreeDisplay';

describe('RouteTreeDisplay', () => {
  describe('Real Data Integration', () => {
    it('should display ProbeFailedExecutionsTooHigh alert hierarchy', () => {
      render(<RouteTreeDisplay routeMatch={MOCK_PROBE_FAILED_ROUTE_MATCH} />);

      // Expected hierarchy based on matchingJourney:
      // Level 0: route-3 (Default policy) → grafana-default-email
      // Level 1: route-4 (alertname=ProbeFailedExecutionsTooHigh) → Email contact point
      // Level 2: route-5 (label_notification=email) → Email contact point
      // Level 3: route-6 (label_per_check_alerts=true) → Email contact point
      // Level 3: route-7 (check_name=http) → Email contact point (sibling to route-6)

      // Level 0: Default policy
      expect(screen.getByText('Default policy')).toBeInTheDocument();

      // Level 1: alertname policy with stop icon (continue=false)
      expect(screen.getByText('alertname=ProbeFailedExecutionsTooHigh')).toBeInTheDocument();

      // Level 2: label_notification policy with stop icon (continue=false)
      expect(screen.getByText('label_notification=email')).toBeInTheDocument();

      // Level 3: Two sibling policies (both continue=true, no stop icons)
      expect(screen.getByText('label_per_check_alerts=true')).toBeInTheDocument();
      expect(screen.getByText('check_name=http')).toBeInTheDocument();

      // Only the deepest route (check_name=http) should show "Email contact point"
      const emailContactPoints = screen.getAllByText('Email contact point');
      expect(emailContactPoints.length).toBe(1);

      // Should show 2 stop icons (routes 4 and 5 have continue=false)
      const stopIcons = screen.getAllByText('⏹️');
      expect(stopIcons.length).toBe(2);

      // Should have 1 contact point link (only the effective route)
      const contactPointLinks = screen.getAllByRole('link');
      expect(contactPointLinks.length).toBe(1);
    });

    it('should display HTTPRequestDurationTooHighAvg alert with multiple policies', () => {
      render(<RouteTreeDisplay routeMatch={MOCK_HTTP_DURATION_ROUTE_MATCH} />);

      // Expected hierarchy based on the image and matchingJourney:
      // Level 0: route-3 (Default policy) → grafana-default-email
      // Level 1: route-8 (* matches all) → Grafana Alerting ❤️
      // Level 1: route-9 (* matches all) → Grafana Alerting 👻 (sibling)
      // Level 1: route-10 (* matches all) → Grafana Alerting Name change 2 😊 (sibling)
      // Level 1: route-12 (label_notification=email) → grafana-default-email (sibling)

      // Level 0: Default policy
      expect(screen.getByText('Default policy')).toBeInTheDocument();
      
      // Only the effective routes should show contact points
      // Based on the routing logic, only the deepest matched routes will show contact points
      const grafanaDefaultEmails = screen.getAllByText('grafana-default-email');
      expect(grafanaDefaultEmails.length).toBe(1); // Only the effective route

      // Level 1: Three "* (matches all)" policies for routes without matchers
      const matchesAllElements = screen.getAllByText('* (matches all)');
      expect(matchesAllElements.length).toBe(3); // route-8, route-9, route-10

      expect(screen.getByText('Grafana Alerting ❤️')).toBeInTheDocument();
      expect(screen.getByText('Grafana Alerting 👻')).toBeInTheDocument();
      expect(screen.getByText('Grafana Alerting Name change 2 😊')).toBeInTheDocument();
      
      // Level 1: label_notification policy
      expect(screen.getByText('label_notification=email')).toBeInTheDocument();

      // Should have 4 contact point links total (only effective routes show links)
      const contactPointLinks = screen.getAllByRole('link');
      expect(contactPointLinks.length).toBe(4);
      
      // Should not show any stop icons since all policies have continue=true
      const stopIcons = screen.queryAllByText('⏹️');
      expect(stopIcons.length).toBe(0);
    });
  });

  describe('Multiple notification policy trees', () => {
    it('labels each tree root with its tree name and only the default tree as "Default policy"', () => {
      render(<RouteTreeDisplay routeMatch={MOCK_MULTI_TREE_ROUTE_MATCH} />);

      // The default ("user-defined") tree root is still shown as "Default policy"
      expect(screen.getByText('Default policy')).toBeInTheDocument();

      // Named trees show their own name at the root rather than "Default policy"
      expect(screen.getByText('hashicorp-vault')).toBeInTheDocument();
      expect(screen.getByText('pam-incident-alert')).toBeInTheDocument();

      // Only the pam-incident-alert tree matches a child route with a contact point
      expect(screen.getByText('label_Environment=prod')).toBeInTheDocument();
      expect(screen.getByText('PAM Incident Alert')).toBeInTheDocument();

      // Only one contact point link, since the other two trees match only at
      // their root with no receiver ("Sent to empty")
      const contactPointLinks = screen.getAllByRole('link');
      expect(contactPointLinks.length).toBe(1);
    });
  });
});
