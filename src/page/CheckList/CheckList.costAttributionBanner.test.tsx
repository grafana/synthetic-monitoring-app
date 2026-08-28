import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockCmabCostAttributionWrite, mockFeatureToggles } from 'test/utils';

import { Check, FeatureName, HTTPCheck } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CAL_BANNER_DISMISSED_KEY, CMAB_URLS } from 'components/CostAttribution/CostAttribution.constants';

import { CheckList } from './CheckList';

const BANNER_TITLE = 'Attribute check costs to teams and services';

function buildChecks(count: number): HTTPCheck[] {
  return Array.from({ length: count }, (_, index) => ({
    ...BASIC_HTTP_CHECK,
    id: index + 1,
    job: `check-job-${index + 1}`,
  }));
}

function mockCalNames(names: string[]) {
  // Returned so tests can wait for the CALs request to resolve before asserting
  // on the banner's absence — otherwise the assertion runs before the banner
  // would have appeared and passes no matter what.
  const onRequest = jest.fn();

  server.use(
    apiRoute(`getTenantCostAttributionLabels`, {
      result: () => {
        onRequest();
        return {
          json: { names },
        };
      },
    })
  );

  return onRequest;
}

async function renderCheckList(checks: Check[]) {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({
        json: checks,
      }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({
        json: [],
      }),
    })
  );

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path: generateRoutePath(AppRoutes.Checks),
  });

  await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument(), { timeout: 5000 });

  return res;
}

describe('CheckList - cost attribution setup banner', () => {
  beforeEach(() => {
    window.localStorage.removeItem(CAL_BANNER_DISMISSED_KEY);
  });

  describe('when CALs feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
    });

    it('shows the banner with a CMAB settings link when no CALs are configured', async () => {
      mockCalNames([]);
      await renderCheckList(buildChecks(5));

      expect(await screen.findByText(BANNER_TITLE)).toBeInTheDocument();
      const cta = screen.getByRole('link', { name: 'Set up cost attribution' });
      expect(cta).toHaveAttribute('href', CMAB_URLS.settings);
    });

    it('shows the banner to tenants with only a single check', async () => {
      mockCalNames([]);
      await renderCheckList(buildChecks(1));

      expect(await screen.findByText(BANNER_TITLE)).toBeInTheDocument();
    });

    it('does not show the banner without cost attribution write permission', async () => {
      mockCmabCostAttributionWrite(false);
      mockCalNames([]);
      await renderCheckList(buildChecks(5));

      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
    });

    it('does not show the banner when the CALs request fails', async () => {
      server.use(
        apiRoute(`getTenantCostAttributionLabels`, {
          result: () => ({
            status: 500,
          }),
        })
      );
      await renderCheckList(buildChecks(5));

      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
    });

    it('does not show the banner when CALs are already configured', async () => {
      mockCalNames([`Team`, `Service`]);
      await renderCheckList(buildChecks(5));

      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
    });

    it('hides the banner for the session when closed, and shows it again on remount', async () => {
      mockCalNames([]);
      const { user, unmount } = await renderCheckList(buildChecks(5));

      expect(await screen.findByText(BANNER_TITLE)).toBeInTheDocument();
      await user.click(screen.getByLabelText('Close alert'));
      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();

      unmount();
      await renderCheckList(buildChecks(5));
      expect(await screen.findByText(BANNER_TITLE)).toBeInTheDocument();
    });

    it('hides the banner permanently when dismissed with "don\'t show again"', async () => {
      const onCalsRequest = mockCalNames([]);
      const { user, unmount } = await renderCheckList(buildChecks(5));

      expect(await screen.findByText(BANNER_TITLE)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: "Understood, don't show again" }));
      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();

      const requestsBeforeRemount = onCalsRequest.mock.calls.length;
      unmount();
      await renderCheckList(buildChecks(5));

      // Only assert once the CALs query has resolved on the remount, since the
      // banner never shows while the query is in flight.
      await waitFor(() => expect(onCalsRequest.mock.calls.length).toBeGreaterThan(requestsBeforeRemount));
      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
    });
  });

  describe('when CALs feature flag is disabled', () => {
    it('does not show the banner', async () => {
      mockCalNames([]);
      await renderCheckList(buildChecks(5));

      expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
    });
  });
});
