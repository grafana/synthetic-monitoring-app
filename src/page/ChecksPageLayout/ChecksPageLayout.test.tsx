import React from 'react';
import { screen, within } from '@testing-library/react';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { InitialisedRouter } from 'routing/InitialisedRouter';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

function renderAt(route: AppRoutes) {
  return render(<InitialisedRouter />, { path: generateRoutePath(route), route: '*' });
}

describe('Checks page tabs', () => {
  describe('with recommendations enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Recommendations]: true }));

    it('offers a Recommendations tab flagged as new, beside the check list', async () => {
      renderAt(AppRoutes.Checks);

      const recommendations = await screen.findByRole('tab', { name: /recommendations/i });

      expect(within(recommendations).getByText('NEW')).toBeInTheDocument();
      expect(recommendations).toHaveAttribute('href', expect.stringContaining('/checks/recommendations'));
      expect(recommendations).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /^checks$/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('keeps the check list rendering under the layout', async () => {
      renderAt(AppRoutes.Checks);

      expect(await screen.findByText(/create new check/i)).toBeInTheDocument();
    });

    it('resolves and activates the Recommendations tab on its own route', async () => {
      renderAt(AppRoutes.CheckRecommendations);

      expect(await screen.findByText(/findings derived from how your checks are configured/i)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /recommendations/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('with recommendations disabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Recommendations]: false }));

    it('leaves the check list untabbed', async () => {
      renderAt(AppRoutes.Checks);

      expect(await screen.findByText(/create new check/i)).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    // With the route unregistered the path falls through to `checks/:id`, so a stale link
    // lands on the check-not-found page rather than the tab.
    it('does not resolve the recommendations route', async () => {
      renderAt(AppRoutes.CheckRecommendations);

      expect(await screen.findByText(/check you're trying to view does not exist/i)).toBeInTheDocument();
    });
  });
});
