import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName, HTTPCheck } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

function buildCheckWithLabels(
  labels: Array<{ name: string; value: string }>,
  overrides?: Partial<HTTPCheck>
): HTTPCheck {
  return {
    ...BASIC_HTTP_CHECK,
    labels,
    ...overrides,
  };
}

const CHECK_WITH_CAL_AND_CUSTOM: HTTPCheck = buildCheckWithLabels([
  { name: 'Team', value: 'frontend' },
  { name: 'Service', value: 'monitoring-api' },
  { name: 'env', value: 'production' },
]);

const CHECK_WITH_ONLY_CALS: HTTPCheck = buildCheckWithLabels([
  { name: 'Team', value: 'platform' },
  { name: 'Service', value: 'auth' },
]);

const CHECK_WITH_ONLY_CUSTOM: HTTPCheck = buildCheckWithLabels([{ name: 'region', value: 'us-east' }]);

const CHECK_WITH_NO_LABELS: HTTPCheck = buildCheckWithLabels([]);

async function renderCheckList(checks: Check[] = [CHECK_WITH_CAL_AND_CUSTOM], searchParams = '') {
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

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument(), { timeout: 5000 });

  return res;
}

describe('CheckList - CAL Display', () => {
  describe('when CALs feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
    });

    describe('card view (default)', () => {
      it('displays CAL tags with distinct styling alongside custom labels', async () => {
        await renderCheckList([CHECK_WITH_CAL_AND_CUSTOM]);

        const card = await screen.findByTestId(DataTestIds.CheckCard);
        expect(within(card).getByText('Team: frontend')).toBeInTheDocument();
        expect(within(card).getByText('Service: monitoring-api')).toBeInTheDocument();
        expect(within(card).getByText('env: production')).toBeInTheDocument();
      });

      it('displays only CAL tags when check has no custom labels', async () => {
        await renderCheckList([CHECK_WITH_ONLY_CALS]);

        const card = await screen.findByTestId(DataTestIds.CheckCard);
        expect(within(card).getByText('Team: platform')).toBeInTheDocument();
        expect(within(card).getByText('Service: auth')).toBeInTheDocument();
      });

      it('displays only custom labels when check labels do not match any CAL names', async () => {
        await renderCheckList([CHECK_WITH_ONLY_CUSTOM]);

        const card = await screen.findByTestId(DataTestIds.CheckCard);
        expect(within(card).getByText('region: us-east')).toBeInTheDocument();
      });

      it('does not show label tags when check has no labels', async () => {
        await renderCheckList([CHECK_WITH_NO_LABELS]);

        const card = await screen.findByTestId(DataTestIds.CheckCard);
        expect(within(card).queryByText(/Team:/)).not.toBeInTheDocument();
        expect(within(card).queryByText(/Service:/)).not.toBeInTheDocument();
      });
    });

    describe('list view', () => {
      it('displays check labels in list view', async () => {
        await renderCheckList([CHECK_WITH_CAL_AND_CUSTOM], 'view=list');

        expect(await screen.findByText(CHECK_WITH_CAL_AND_CUSTOM.job)).toBeInTheDocument();
      });
    });
  });

  describe('when CALs feature flag is disabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: false });
    });

    it('displays all labels as regular labels without CAL distinction', async () => {
      await renderCheckList([CHECK_WITH_CAL_AND_CUSTOM]);

      const card = await screen.findByTestId(DataTestIds.CheckCard);
      expect(within(card).getByText('Team: frontend')).toBeInTheDocument();
      expect(within(card).getByText('Service: monitoring-api')).toBeInTheDocument();
      expect(within(card).getByText('env: production')).toBeInTheDocument();
    });
  });
});
