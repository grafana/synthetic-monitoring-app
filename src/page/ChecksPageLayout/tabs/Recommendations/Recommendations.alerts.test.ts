import { DB } from 'test/db';

import { Check, CheckAlertType, CheckType } from 'types';

import { getRecommendedAlerts, runInBatches } from './Recommendations.alerts';

const MINUTE = 60 * 1000;

function buildCheck(frequency: number, type: CheckType): Check {
  return DB.check.build({ frequency }, { transient: { type } });
}

describe('getRecommendedAlerts', () => {
  it('recommends the editor defaults for the check type', () => {
    const alerts = getRecommendedAlerts(buildCheck(MINUTE, CheckType.Http));

    expect(alerts.map(({ draft }) => draft)).toEqual([
      { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 1, period: '5m' },
      { name: CheckAlertType.TLSTargetCertificateCloseToExpiring, threshold: 30 },
      { name: CheckAlertType.HTTPRequestDurationTooHighAvg, threshold: 300, period: '5m' },
    ]);
  });

  it('only recommends the failed-executions alert for check types without type-specific alerts', () => {
    const alerts = getRecommendedAlerts(buildCheck(MINUTE, CheckType.Scripted));

    expect(alerts.map(({ draft }) => draft.name)).toEqual([CheckAlertType.ProbeFailedExecutionsTooHigh]);
  });

  it('picks the shortest period that is at least the check frequency', () => {
    const alerts = getRecommendedAlerts(buildCheck(12 * MINUTE, CheckType.Ping));

    expect(alerts.map(({ draft }) => draft.period)).toEqual(['15m', '15m']);
  });

  it('leaves out period-based alerts when the check runs less often than the longest period', () => {
    const alerts = getRecommendedAlerts(buildCheck(2 * 60 * MINUTE, CheckType.Http));

    expect(alerts.map(({ draft }) => draft.name)).toEqual([CheckAlertType.TLSTargetCertificateCloseToExpiring]);
  });
});

describe('runInBatches', () => {
  it('never runs more than the batch size at once and reports every outcome', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const results = await runInBatches([1, 2, 3, 4, 5], 2, async (item) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;

      if (item === 3) {
        throw new Error('boom');
      }

      return item;
    });

    expect(maxInFlight).toBe(2);
    expect(results.map((result) => result.status)).toEqual([
      'fulfilled',
      'fulfilled',
      'rejected',
      'fulfilled',
      'fulfilled',
    ]);
  });
});
