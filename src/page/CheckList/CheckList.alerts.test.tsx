import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_CHECK_LIST, BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckCompositeKey, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { CheckList } from './CheckList';

jest.mock('data/useCheckAlertStates', () => {
  const actual = jest.requireActual('data/useCheckAlertStates');
  return {
    ...actual,
    useChecksAlertStates: jest.fn(),
  };
});

const { useChecksAlertStates } = jest.requireMock('data/useCheckAlertStates') as {
  useChecksAlertStates: jest.MockedFunction<() => Partial<UseQueryResult<CheckRuntimeAlertStates>>>;
};

function buildAlertStates(...entries: Array<{ check: Check; alertNames: string[] }>): CheckRuntimeAlertStates {
  const states: CheckRuntimeAlertStates = {};

  for (const { check, alertNames } of entries) {
    const key = getCheckCompositeKey(check.job, check.target);
    states[key] = {
      firingCount: alertNames.length,
      firingAlertNames: new Set(alertNames),
    };
  }

  return states;
}

function mockAlertStates(states: CheckRuntimeAlertStates = {}) {
  useChecksAlertStates.mockReturnValue({
    data: states,
    isFetched: true,
    isFetching: false,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
  } as any);
}

const renderCheckList = async (checks = BASIC_CHECK_LIST, searchParams = '') => {
  server.use(
    apiRoute('listChecks', {
      result: () => {
        return {
          json: checks,
        };
      },
    }),
    apiRoute('listProbes', {
      result: () => {
        return {
          json: [],
        };
      },
    })
  );

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Alerts', () => {
  beforeEach(() => {
    mockAlertStates();
  });

  test('firing check sorts to the top above non-firing checks', async () => {
    mockAlertStates(buildAlertStates({ check: BASIC_HTTP_CHECK, alertNames: ['ProbeFailedExecutionsTooHigh'] }));

    await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], 'sort=atoz');

    await waitFor(
      () => {
        const cards = screen.getAllByTestId(DataTestIds.CheckCard);
        expect(cards.length).toBe(2);
        expect(cards[0]).toHaveTextContent(BASIC_HTTP_CHECK.job);
        expect(cards[1]).toHaveTextContent(BASIC_DNS_CHECK.job);
      },
      { timeout: 5000 }
    );
  });

  test('shows "Alert firing" button when one alert is firing', async () => {
    mockAlertStates(buildAlertStates({ check: BASIC_HTTP_CHECK, alertNames: ['ProbeFailedExecutionsTooHigh'] }));

    await renderCheckList([BASIC_HTTP_CHECK]);

    expect(await screen.findByLabelText('Alert firing')).toBeInTheDocument();
  });

  test('shows "N alerts firing" button when multiple alerts fire for one check', async () => {
    mockAlertStates(
      buildAlertStates({
        check: BASIC_HTTP_CHECK,
        alertNames: ['ProbeFailedExecutionsTooHigh', 'TLSTargetCertificateCloseToExpiring'],
      })
    );

    await renderCheckList([BASIC_HTTP_CHECK]);

    expect(await screen.findByLabelText('2 alerts firing')).toBeInTheDocument();
  });

  test('does not show firing button when nothing is firing', async () => {
    mockAlertStates();

    await renderCheckList([BASIC_HTTP_CHECK]);

    await screen.findAllByTestId(DataTestIds.CheckCard);

    expect(screen.queryByLabelText('Alert firing')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/alerts firing/i)).not.toBeInTheDocument();
  });

  test('shows normal bell button when no alerts are firing for a check with alerting configured', async () => {
    mockAlertStates();

    await renderCheckList([BASIC_HTTP_CHECK]);

    expect(await screen.findByLabelText('Alert rules')).toBeInTheDocument();
  });

  test('returns empty alert state for a check with no alerts configured', () => {
    const emptyStates: CheckRuntimeAlertStates = {};
    const state = getCheckRuntimeAlertState(emptyStates, BASIC_DNS_CHECK);

    expect(state.firingCount).toBe(0);
    expect(state.firingAlertNames.size).toBe(0);
  });
});
