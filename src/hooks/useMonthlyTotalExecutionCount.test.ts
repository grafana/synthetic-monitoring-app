import { renderHook, waitFor } from '@testing-library/react';
import { getTotalChecksPerMonth } from 'checkUsageCalc';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { Check } from 'types';
import { useMonthlyTotalExecutionCount } from 'hooks/useMonthlyTotalExecutionCount';

async function renderExecutionCountHook(checks?: Check[]) {
  if (checks) {
    server.use(
      apiRoute('listChecks', {
        result: () => {
          return {
            json: checks,
          };
        },
      })
    );
  }

  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useMonthlyTotalExecutionCount(), { wrapper: Wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).not.toBe(true);
  });

  expect(result.current.error).toBeFalsy();

  return result;
}

const FREQUENCY = 60000;
const FREQUENCY_SECONDS = FREQUENCY / 1000;
const PROBES = [PRIVATE_PROBE.id!];
const EXECUTIONS = getTotalChecksPerMonth(PROBES.length, FREQUENCY_SECONDS);

describe('calculates execution count correctly', () => {
  test('handles calculation for 1 active check correctly', async () => {
    const result = await renderExecutionCountHook([
      {
        ...BASIC_PING_CHECK,
        enabled: true,
        frequency: FREQUENCY,
        probes: PROBES,
      },
    ]);

    expect(result.current.data).toBe(EXECUTIONS);
  });

  test('handles calculation for 1 active and 1 disabled check correctly', async () => {
    const result = await renderExecutionCountHook([
      {
        ...BASIC_PING_CHECK,
        enabled: true,
        frequency: FREQUENCY,
        probes: PROBES,
      },
      {
        ...BASIC_PING_CHECK,
        enabled: false,
        frequency: FREQUENCY,
        probes: PROBES,
      },
    ]);

    expect(result.current.data).toBe(EXECUTIONS);
  });
});
