import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { CHECK_IN_EXTERNAL_FOLDER } from 'test/fixtures/folderChecks';
import { apiRoute } from 'test/handlers';
import { spyUsePluginFunctionsForSLOs } from 'test/helpers/mockUsePluginFunctionsForSLOs';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import type { SLO } from 'scenes/Common/grafanaSLOApp.types';
import { sloQueryKeys } from 'scenes/Common/useSLOCheckLinks';

import { CheckList } from './CheckList';

function buildReachabilitySLO(check: Check, overrides: Partial<SLO> = {}): SLO {
  const selector = `{job="${check.job}", instance="${check.target}"}`;

  return {
    uuid: `slo-${check.id}`,
    name: `${check.job} reachability`,
    description: '',
    objectives: [{ value: 0.995, window: '28d' }],
    query: {
      type: 'ratio',
      ratio: {
        successMetric: { prometheusMetric: `probe_all_success_sum${selector}` },
        totalMetric: { prometheusMetric: `probe_all_success_count${selector}` },
      },
    },
    ...overrides,
  };
}

const renderCheckList = async (checks: Check[], searchParams = '') => {
  server.use(
    apiRoute('listChecks', {
      result: () => ({ json: checks }),
    }),
    apiRoute('listProbes', {
      result: () => ({ json: [] }),
    })
  );

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path: `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`,
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - SLOs', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
    usePluginFunctionsSpy = undefined;
  });

  test('shows a linked-SLO badge only on the check the SLO targets', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([buildReachabilitySLO(BASIC_HTTP_CHECK)]);

    await renderCheckList([BASIC_HTTP_CHECK, BASIC_DNS_CHECK]);

    const badge = await screen.findByRole('button', { name: 'Linked to 1 SLO' });
    const [httpCard] = screen
      .getAllByTestId(CHECKS_TEST_ID.card)
      .filter((card) => within(card).queryByText(BASIC_HTTP_CHECK.job));
    expect(httpCard).toContainElement(badge);
    expect(screen.getAllByRole('button', { name: /^Linked to/ })).toHaveLength(1);
  });

  test('lists every linked SLO in the badge toggletip, linking to its dashboard or SLO app page', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([
      buildReachabilitySLO(BASIC_HTTP_CHECK, {
        uuid: 'slo-with-dashboard',
        name: 'HTTP availability',
        readOnly: { drillDownDashboardRef: { UID: 'slo-dashboard-uid' }, creationTimestamp: 0 },
      }),
      buildReachabilitySLO(BASIC_HTTP_CHECK, { uuid: 'slo-without-dashboard', name: 'HTTP reachability' }),
    ]);

    const { user } = await renderCheckList([BASIC_HTTP_CHECK]);
    await user.click(await screen.findByRole('button', { name: 'Linked to 2 SLOs' }));

    expect(await screen.findByText('Linked SLOs (2)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HTTP availability' })).toHaveAttribute('href', '/d/slo-dashboard-uid');
    expect(screen.getByRole('link', { name: 'HTTP reachability' })).toHaveAttribute(
      'href',
      '/a/grafana-slo-app/wizard/review/slo-without-dashboard'
    );
  });

  test('shows the linked-SLO badge in list view', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([buildReachabilitySLO(BASIC_HTTP_CHECK)]);

    await renderCheckList([BASIC_HTTP_CHECK, BASIC_DNS_CHECK], 'view=list');

    expect(screen.getByRole('radio', { name: 'List view' })).toBeChecked();
    expect(await screen.findByRole('button', { name: 'Linked to 1 SLO' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Linked to/ })).toHaveLength(1);
  });

  test('shows no SLO badge or SLO status when the SLO app exposes no API', async () => {
    await renderCheckList([BASIC_HTTP_CHECK]);
    await screen.findByText(BASIC_HTTP_CHECK.job);

    expect(screen.queryByRole('button', { name: /^Linked to/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/linked SLOs/i)).not.toBeInTheDocument();
  });

  test('shows a retry banner when fetching linked SLOs fails, and the badge once a retry succeeds', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([buildReachabilitySLO(BASIC_HTTP_CHECK)], {
      failuresBeforeSuccess: 1,
    });

    const { user } = await renderCheckList([BASIC_HTTP_CHECK]);
    await user.click(await screen.findByText('Failed to fetch linked SLOs. Retry?'));

    expect(await screen.findByRole('button', { name: 'Linked to 1 SLO' })).toBeInTheDocument();
    expect(screen.queryByText('Failed to fetch linked SLOs. Retry?')).not.toBeInTheDocument();
  });

  test('shows no linked-SLO badge or retry banner when the user is not allowed to read SLOs', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([buildReachabilitySLO(BASIC_HTTP_CHECK)], {
      forbidden: true,
    });

    const { queryClient } = await renderCheckList([BASIC_HTTP_CHECK]);
    await waitFor(() => expect(queryClient.getQueryState(sloQueryKeys.all)?.status).toBe('error'));

    expect(screen.queryByText('Failed to fetch linked SLOs. Retry?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Linked to/ })).not.toBeInTheDocument();
  });

  describe('with folders enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    test('shows the linked-SLO badge in folder view', async () => {
      usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([buildReachabilitySLO(CHECK_IN_EXTERNAL_FOLDER)]);

      await renderCheckList([CHECK_IN_EXTERNAL_FOLDER], 'view=folder');

      expect(await screen.findByRole('button', { name: 'Linked to 1 SLO' })).toBeInTheDocument();
    });
  });
});
