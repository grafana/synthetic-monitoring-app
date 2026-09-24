import React from 'react';
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import { UI_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { InitialisedRouter } from 'routing/InitialisedRouter';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import * as useFeatureFlagModule from 'hooks/useFeatureFlag';

jest.mock('hooks/useFeatureFlag', () => {
  const actual = jest.requireActual('hooks/useFeatureFlag');
  return { ...actual, useFeatureFlag: jest.fn(actual.useFeatureFlag) };
});

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

    it('shows not found on the recommendations route', async () => {
      renderAt(AppRoutes.CheckRecommendations);

      expect(await screen.findByText(/page you are looking for does not exist/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /checks listing/i })).toHaveAttribute(
        'href',
        expect.stringContaining('/checks')
      );
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('while the flag is still resolving', () => {
    beforeEach(() => {
      jest.mocked(useFeatureFlagModule.useFeatureFlag).mockReturnValue({ isEnabled: false, isReady: false });
    });

    it('holds the recommendations route on a spinner instead of not found', async () => {
      renderAt(AppRoutes.CheckRecommendations);

      // The providers' own loading spinner comes first.
      await waitForElementToBeRemoved(() => screen.queryByTestId(UI_TEST_ID.centeredSpinner));

      expect(await screen.findByTestId('Spinner')).toBeInTheDocument();
      expect(screen.queryByText(/page you are looking for does not exist/i)).not.toBeInTheDocument();
    });
  });
});
