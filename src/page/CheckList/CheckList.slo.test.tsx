import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import type { SLO } from 'scenes/Common/grafanaSLOApp.types';
import type { SLOCheckLinkMap } from 'scenes/Common/useSLOCheckLinks.utils';

import { CheckList } from './CheckList';

jest.mock('scenes/Common/useSLOCheckLinks', () => {
  const actual = jest.requireActual('scenes/Common/useSLOCheckLinks');
  return {
    ...actual,
    useSLOCheckLinkMap: jest.fn(),
  };
});

const { useSLOCheckLinkMap } = jest.requireMock('scenes/Common/useSLOCheckLinks') as {
  useSLOCheckLinkMap: jest.MockedFunction<
    () => {
      map: SLOCheckLinkMap;
      isLoading: boolean;
      error?: Error;
      sloError?: Error;
      isSLOsFetching: boolean;
      refetchSLOs: () => void;
    }
  >;
};

const EMPTY_MAP: SLOCheckLinkMap = { slosByCheckId: new Map(), checksBySLOUuid: new Map() };

function mockSLOCheckLinkMap(
  overrides: Partial<{
    map: SLOCheckLinkMap;
    sloError: Error;
    isSLOsFetching: boolean;
    refetchSLOs: () => void;
  }> = {}
) {
  useSLOCheckLinkMap.mockReturnValue({
    map: EMPTY_MAP,
    isLoading: false,
    error: undefined,
    sloError: undefined,
    isSLOsFetching: false,
    refetchSLOs: jest.fn(),
    ...overrides,
  });
}

const renderCheckList = async (checks = BASIC_CHECK_LIST) => {
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
    path: generateRoutePath(AppRoutes.Checks),
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - SLOs', () => {
  beforeEach(() => {
    mockSLOCheckLinkMap();
  });

  test('shows a linked-SLO badge for a check with a linked SLO', async () => {
    const slo: SLO = { uuid: 'slo-1', name: 'API availability', description: '', objectives: [], query: { type: 'ratio' } };
    mockSLOCheckLinkMap({
      map: { slosByCheckId: new Map([[BASIC_HTTP_CHECK.id!, [slo]]]), checksBySLOUuid: new Map() },
    });

    await renderCheckList([BASIC_HTTP_CHECK]);

    expect(await screen.findByLabelText('Linked to 1 SLO')).toBeInTheDocument();
  });

  test('does not show a badge for a check with no linked SLO', async () => {
    await renderCheckList([BASIC_HTTP_CHECK]);
    await screen.findByText(BASIC_HTTP_CHECK.job);

    expect(screen.queryByLabelText(/Linked to \d+ SLOs?/)).not.toBeInTheDocument();
  });

  test('shows a retry banner when fetching linked SLOs fails, and retries on click', async () => {
    const refetchSLOs = jest.fn();
    mockSLOCheckLinkMap({ sloError: new Error('boom'), refetchSLOs });

    const { user } = await renderCheckList([BASIC_HTTP_CHECK]);

    const retryButton = await screen.findByText('Failed to fetch linked SLOs. Retry?');
    await user.click(retryButton);

    expect(refetchSLOs).toHaveBeenCalled();
  });

  test('does not show a retry banner while checks have no SLO fetch error', async () => {
    await renderCheckList([BASIC_HTTP_CHECK]);
    await screen.findByText(BASIC_HTTP_CHECK.job);

    expect(screen.queryByText('Failed to fetch linked SLOs. Retry?')).not.toBeInTheDocument();
  });
});
