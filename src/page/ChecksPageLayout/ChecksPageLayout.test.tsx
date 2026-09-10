import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { InitialisedRouter } from 'routing/InitialisedRouter';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

function renderAt(route: AppRoutes) {
  return render(<InitialisedRouter />, { path: generateRoutePath(route), route: '*' });
}

// The tab strip itself is Grafana page chrome, which `PluginPage` does not render outside
// Grafana, so these cover which page each route resolves to rather than the tabs.
describe('Checks page tabs', () => {
  it('resolves the recommendations route when the feature is enabled', async () => {
    mockFeatureToggles({ [FeatureName.Recommendations]: true });

    renderAt(AppRoutes.CheckRecommendations);

    expect(await screen.findByText(/findings derived from how your checks are configured/i)).toBeInTheDocument();
  });

  // With the route unregistered the path falls through to `checks/:id`, so a stale link lands
  // on the check-not-found page rather than the tab.
  it('does not resolve the recommendations route when the feature is disabled', async () => {
    mockFeatureToggles({ [FeatureName.Recommendations]: false });

    renderAt(AppRoutes.CheckRecommendations);

    expect(await screen.findByText(/check you're trying to view does not exist/i)).toBeInTheDocument();
  });

  it('still renders the check list under the layout', async () => {
    mockFeatureToggles({ [FeatureName.Recommendations]: true });

    renderAt(AppRoutes.Checks);

    expect(await screen.findByText(/create new check/i)).toBeInTheDocument();
  });
});
