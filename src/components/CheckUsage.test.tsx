import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockCmabCostAttributionWrite, mockFeatureToggles } from 'test/utils';

import { Check, CheckType, FeatureName } from 'types';

import { ChecksterProvider } from './Checkster/contexts/ChecksterContext';
import { CMAB_URLS } from './CostAttribution/CostAttribution.constants';
import { CheckUsage } from './CheckUsage';
import { FALLBACK_CHECK_MAP } from './constants';

jest.mock('features/tracking/costAttributionEvents', () => ({
  trackCmabLinkClicked: jest.fn(),
}));

import { trackCmabLinkClicked } from 'features/tracking/costAttributionEvents';

const mockTrackCmabLinkClicked = trackCmabLinkClicked as jest.MockedFunction<typeof trackCmabLinkClicked>;

const FOOTER_LINK_TEXT = 'Attribute check costs to teams and services';

function RenderWrapper({ checkType = CheckType.Http }: { checkType?: CheckType }) {
  return (
    <ChecksterProvider checkType={checkType}>
      <CheckUsage checkType={checkType} />
    </ChecksterProvider>
  );
}

function mockCalNames(names: string[]) {
  server.use(
    apiRoute(`getTenantCostAttributionLabels`, {
      result: () => ({
        json: { names },
      }),
    })
  );
}

async function renderComponent(_check?: Check, checkType: CheckType = CheckType.Http) {
  const result = render(<RenderWrapper checkType={checkType} />);
  await waitFor(() => screen.findByTestId(CHECKS_TEST_ID.usage), { timeout: 3000 });

  return result;
}

describe('CheckUsage', () => {
  describe('existing check', () => {
    const mockedCheck = FALLBACK_CHECK_MAP[CheckType.Http];
    it('should render', async () => {
      const { container } = await renderComponent(mockedCheck);
      expect(container).toBeInTheDocument();
    });

    it('should render the correct label', async () => {
      await renderComponent(mockedCheck);
      expect(await screen.findByRole('heading', { name: 'Estimated usage for this check' })).toBeInTheDocument();
    });
  });

  describe('new check', () => {
    it('should render', async () => {
      const { container } = await renderComponent();
      expect(container).toBeInTheDocument();
    });

    it('should render the correct label', async () => {
      await renderComponent();
      expect(await screen.findByRole('heading', { name: 'Estimated usage for this check' })).toBeInTheDocument();
    });
  });

  describe('cost attribution setup nudge', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      mockCalNames([]);
      mockTrackCmabLinkClicked.mockClear();
    });

    it('shows a CMAB settings link for admins when no CALs are configured', async () => {
      await renderComponent();

      const link = await screen.findByRole('link', { name: FOOTER_LINK_TEXT });
      expect(link).toHaveAttribute('href', CMAB_URLS.settings);
    });

    it('does not show the CMAB settings link without cost attribution write permission', async () => {
      mockCmabCostAttributionWrite(false);
      await renderComponent();

      await screen.findByTestId(CHECKS_TEST_ID.usage);
      expect(screen.queryByRole('link', { name: FOOTER_LINK_TEXT })).not.toBeInTheDocument();
    });

    it.each([CheckType.Scripted, CheckType.MultiHttp, CheckType.Browser])(
      'shows a CMAB settings link for check types that hide billed telemetry (%s)',
      async (checkType) => {
        await renderComponent(undefined, checkType);

        const link = await screen.findByRole('link', { name: FOOTER_LINK_TEXT });
        expect(link).toHaveAttribute('href', CMAB_URLS.settings);
      }
    );

    it('tracks executions_per_month when the footer nudge is shown for k6 check types', async () => {
      const { user } = await renderComponent(undefined, CheckType.Scripted);

      await user.click(await screen.findByRole('link', { name: FOOTER_LINK_TEXT }));

      expect(mockTrackCmabLinkClicked).toHaveBeenCalledWith({
        source: 'check_form_usage_footer',
        metric: 'executions_per_month',
      });
    });

    it('tracks active_series when the footer nudge is shown for HTTP checks', async () => {
      const { user } = await renderComponent(undefined, CheckType.Http);

      await user.click(await screen.findByRole('link', { name: FOOTER_LINK_TEXT }));

      expect(mockTrackCmabLinkClicked).toHaveBeenCalledWith({
        source: 'check_form_usage_footer',
        metric: 'active_series',
      });
    });
  });
});
