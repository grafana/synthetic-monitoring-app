import { DB } from 'test/db';

import { Check, CheckAlertType, CheckType } from 'types';

import { getRecommendedAlerts, isFailure, runInBatches } from './Recommendations.alerts';

const MINUTE = 60 * 1000;

function buildCheck(frequency: number, type: CheckType): Check {
  return DB.check.build({ frequency }, { transient: { type } });
}

describe('getRecommendedAlerts', () => {
  it('omits certificate expiry for a TCP check without TLS, which the editor rejects', () => {
    const check = DB.check.build({ frequency: MINUTE }, { transient: { type: CheckType.Tcp } });

    if (!('tcp' in check.settings)) {
      throw new Error('expected a TCP check');
    }

    const withoutTls: Check = { ...check, settings: { tcp: { ...check.settings.tcp, tls: false } } };
    const withTls: Check = { ...check, settings: { tcp: { ...check.settings.tcp, tls: true } } };

    const names = (c: Check) => getRecommendedAlerts(c).map(({ draft }) => draft.name);

    expect(names(withoutTls)).not.toContain(CheckAlertType.TLSTargetCertificateCloseToExpiring);
    expect(names(withTls)).toContain(CheckAlertType.TLSTargetCertificateCloseToExpiring);
  });

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

  it('stops submitting once cancelled, without counting the unsubmitted items as failures', async () => {
    let cancelled = false;
    const submitted: number[] = [];

    const results = await runInBatches(
      [1, 2, 3, 4, 5],
      2,
      async (item) => {
        submitted.push(item);
        // The tab unmounting mid-way through the first batch.
        cancelled = true;

        if (item === 2) {
          throw new Error('boom');
        }

        return item;
      },
      () => cancelled
    );

    expect(submitted).toEqual([1, 2]);
    expect(results).toHaveLength(5);
    expect(results.filter(isFailure)).toHaveLength(1);
  });
});
