import { CheckAlertType } from 'types';

import { validateAlertDraft } from './alertDraftValidation';

describe('validateAlertDraft', () => {
  it('rejects a period shorter than the check frequency', () => {
    expect(
      validateAlertDraft({
        draft: {
          name: CheckAlertType.HTTPRequestDurationTooHighAvg,
          threshold: 300,
          period: '5m',
        },
        frequency: 10 * 60 * 1000,
        probeCount: 1,
      })
    ).toEqual({ period: 'Period (5m) must be equal or higher to the frequency (10 minutes)' });
  });

  it('rejects failed-execution thresholds above executions in the period', () => {
    expect(
      validateAlertDraft({
        draft: {
          name: CheckAlertType.ProbeFailedExecutionsTooHigh,
          threshold: 11,
          period: '5m',
        },
        frequency: 60_000,
        probeCount: 2,
      })
    ).toEqual({
      threshold: 'Threshold (11) must be lower than or equal to the total number of checks per period (10)',
    });
  });

  it('accepts TLS alerts without a period', () => {
    expect(
      validateAlertDraft({
        draft: {
          name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
          threshold: 30,
        },
        frequency: 60_000,
        probeCount: 2,
      })
    ).toEqual({});
  });

  it.each([Number.NaN, 0, 1.5])('rejects an invalid threshold of %s', (threshold) => {
    expect(
      validateAlertDraft({
        draft: {
          name: CheckAlertType.HTTPRequestDurationTooHighAvg,
          threshold,
          period: '5m',
        },
        frequency: 60_000,
        probeCount: 1,
      })
    ).toEqual({ threshold: 'Threshold must be a whole number of at least 1' });
  });

  it('requires a period for alerts which are evaluated over time', () => {
    expect(
      validateAlertDraft({
        draft: {
          name: CheckAlertType.ProbeFailedExecutionsTooHigh,
          threshold: 1,
        },
        frequency: 60_000,
        probeCount: 1,
      })
    ).toEqual({ period: 'Choose a period for this alert' });
  });
});
