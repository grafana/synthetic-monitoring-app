import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockCmabCostAttributionWrite, mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';

import { CMAB_URLS } from './CostAttribution.constants';
import { CostAttributionUsageTooltip } from './CostAttributionUsageTooltip';

const CHILD_TEXT = '42 active series';
const TOOLTIP_LINK_TEXT = 'Attribute check costs to teams and services';

function mockCalNames(names: string[]) {
  server.use(
    apiRoute(`getTenantCostAttributionLabels`, {
      result: () => ({
        json: { names },
      }),
    })
  );
}

function renderTooltip() {
  return render(
    <CostAttributionUsageTooltip source="check_list" metric="active_series">
      <span>{CHILD_TEXT}</span>
    </CostAttributionUsageTooltip>
  );
}

describe('CostAttributionUsageTooltip', () => {
  describe('when CALs feature flag is enabled and no CALs are configured', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      mockCalNames([]);
    });

    it('shows a CMAB settings link on hover', async () => {
      const { user } = renderTooltip();

      // The tooltip wrapper (focusable span) only renders once the CALs query has
      // resolved to "no labels configured" — wait for it before hovering.
      await waitFor(() => {
        expect(screen.getByText(CHILD_TEXT).closest('span[tabindex]')).toBeInTheDocument();
      });
      await user.hover(screen.getByText(CHILD_TEXT));

      const link = await screen.findByRole('link', { name: new RegExp(TOOLTIP_LINK_TEXT) });
      expect(link).toHaveAttribute('href', CMAB_URLS.settings);
    });

    it('renders children without a tooltip when the user lacks cost attribution write permission', async () => {
      mockCmabCostAttributionWrite(false);
      const { user } = renderTooltip();

      await user.hover(await screen.findByText(CHILD_TEXT));

      expect(screen.queryByRole('link', { name: new RegExp(TOOLTIP_LINK_TEXT) })).not.toBeInTheDocument();
    });
  });

  describe('when CALs are already configured', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      mockCalNames([`Team`, `Service`]);
    });

    it('renders children without a tooltip', async () => {
      const { user } = renderTooltip();

      const child = await screen.findByText(CHILD_TEXT);
      // Wait for the CALs query to settle so needsSetup has resolved before hovering.
      await waitFor(() => expect(child).toBeInTheDocument());
      await user.hover(child);

      expect(screen.queryByRole('link', { name: new RegExp(TOOLTIP_LINK_TEXT) })).not.toBeInTheDocument();
    });
  });

  describe('when the CALs request fails', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      server.use(
        apiRoute(`getTenantCostAttributionLabels`, {
          result: () => ({
            status: 500,
          }),
        })
      );
    });

    it('renders children without a tooltip', async () => {
      const { user } = renderTooltip();

      await user.hover(await screen.findByText(CHILD_TEXT));

      expect(screen.queryByRole('link', { name: new RegExp(TOOLTIP_LINK_TEXT) })).not.toBeInTheDocument();
    });
  });

  describe('when CALs feature flag is disabled', () => {
    it('renders children without a tooltip', async () => {
      mockCalNames([]);
      const { user } = renderTooltip();

      await user.hover(await screen.findByText(CHILD_TEXT));

      expect(screen.queryByRole('link', { name: new RegExp(TOOLTIP_LINK_TEXT) })).not.toBeInTheDocument();
    });
  });
});
