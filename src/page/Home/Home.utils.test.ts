import { DB } from 'test/db';

import { CheckHealthStatus } from './Home.types';
import { Check, CheckType } from 'types';

import { computeCheckHealth, matchesFilters, sortBySeverity, summarizeKpis } from './Home.utils';

function buildCheck(partial: Partial<Check> = {}, type: CheckType = CheckType.Http): Check {
  return DB.check.build(partial, { transient: { type } });
}

function metric(check: Check, value: number | string) {
  return {
    metric: { instance: check.target, job: check.job },
    value: [1598535155, value] as [number, number | string],
  };
}

const REACHABILITY_THRESHOLD = { upperLimit: 99, lowerLimit: 75 };

describe('computeCheckHealth', () => {
  it('classifies a check with zero recent success rate as Down, even when alerts are firing', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, 0)],
      reachabilityRates: [metric(check, 0.5)],
      alertStates: { [`${check.job}\0${check.target}`]: { firingCount: 2, firingAlertNames: new Set(['a', 'b']) } },
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Down);
    expect(health.firingCount).toBe(2);
  });

  it('classifies a passing check with firing alerts as Firing', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, 1)],
      reachabilityRates: [metric(check, 1)],
      alertStates: { [`${check.job}\0${check.target}`]: { firingCount: 1, firingAlertNames: new Set(['a']) } },
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Firing);
  });

  it('classifies partial recent failures as Degraded', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, 0.8)],
      reachabilityRates: [metric(check, 1)],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Degraded);
  });

  it('classifies reachability at or below the threshold upper limit as Degraded (percent scale)', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, 1)],
      reachabilityRates: [metric(check, 0.985)],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Degraded);
  });

  it('classifies a check with no metrics as NoData', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [],
      reachabilityRates: [],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.NoData);
  });

  it('treats NaN metric values as missing data', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, NaN)],
      reachabilityRates: [metric(check, 'NaN')],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.NoData);
  });

  it('falls back to reachability when the recent window has no data (slow checks)', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [],
      reachabilityRates: [metric(check, 1)],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Healthy);
  });

  it('classifies a fully passing check as Healthy', () => {
    const check = buildCheck();

    const [health] = computeCheckHealth({
      checks: [check],
      currentSuccessRates: [metric(check, 1)],
      reachabilityRates: [metric(check, 1)],
      reachabilityThreshold: REACHABILITY_THRESHOLD,
    });

    expect(health.status).toBe(CheckHealthStatus.Healthy);
  });

  it('excludes disabled checks', () => {
    const enabled = buildCheck({ enabled: true });
    const disabled = buildCheck({ enabled: false });

    const result = computeCheckHealth({
      checks: [enabled, disabled],
      currentSuccessRates: [metric(enabled, 1), metric(disabled, 0)],
      reachabilityRates: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].check).toBe(enabled);
  });
});

describe('sortBySeverity', () => {
  it('orders Down before Firing before Degraded before NoData before Healthy', () => {
    const down = buildCheck({ job: 'down' });
    const firing = buildCheck({ job: 'firing' });
    const degraded = buildCheck({ job: 'degraded' });
    const noData = buildCheck({ job: 'nodata' });
    const healthy = buildCheck({ job: 'healthy' });

    const result = computeCheckHealth({
      checks: [healthy, noData, degraded, firing, down],
      currentSuccessRates: [
        metric(down, 0),
        metric(firing, 1),
        metric(degraded, 0.5),
        metric(healthy, 1),
      ],
      reachabilityRates: [metric(firing, 1), metric(healthy, 1)],
      alertStates: { [`${firing.job}\0${firing.target}`]: { firingCount: 1, firingAlertNames: new Set(['a']) } },
    }).sort(sortBySeverity);

    expect(result.map(({ check }) => check.job)).toEqual(['down', 'firing', 'degraded', 'nodata', 'healthy']);
  });

  it('orders worst reachability first within Down', () => {
    const worse = buildCheck({ job: 'worse' });
    const bad = buildCheck({ job: 'bad' });

    const result = computeCheckHealth({
      checks: [bad, worse],
      currentSuccessRates: [metric(bad, 0), metric(worse, 0)],
      reachabilityRates: [metric(bad, 0.9), metric(worse, 0.1)],
    }).sort(sortBySeverity);

    expect(result.map(({ check }) => check.job)).toEqual(['worse', 'bad']);
  });

  it('orders most firing alerts first within Firing', () => {
    const noisy = buildCheck({ job: 'noisy' });
    const quiet = buildCheck({ job: 'quiet' });

    const result = computeCheckHealth({
      checks: [quiet, noisy],
      currentSuccessRates: [metric(quiet, 1), metric(noisy, 1)],
      reachabilityRates: [metric(quiet, 1), metric(noisy, 1)],
      alertStates: {
        [`${quiet.job}\0${quiet.target}`]: { firingCount: 1, firingAlertNames: new Set(['a']) },
        [`${noisy.job}\0${noisy.target}`]: { firingCount: 3, firingAlertNames: new Set(['a', 'b', 'c']) },
      },
    }).sort(sortBySeverity);

    expect(result.map(({ check }) => check.job)).toEqual(['noisy', 'quiet']);
  });

  it('tie-breaks by job name', () => {
    const checkB = buildCheck({ job: 'b-job' });
    const checkA = buildCheck({ job: 'a-job' });

    const result = computeCheckHealth({
      checks: [checkB, checkA],
      currentSuccessRates: [metric(checkB, 1), metric(checkA, 1)],
      reachabilityRates: [metric(checkB, 1), metric(checkA, 1)],
    }).sort(sortBySeverity);

    expect(result.map(({ check }) => check.job)).toEqual(['a-job', 'b-job']);
  });
});

describe('summarizeKpis', () => {
  it('counts statuses, total firing alerts, and disabled checks', () => {
    const down = buildCheck({ job: 'down' });
    const firing = buildCheck({ job: 'firing' });
    const healthy = buildCheck({ job: 'healthy' });
    const disabled = buildCheck({ job: 'disabled', enabled: false });
    const checks = [down, firing, healthy, disabled];

    const checkHealth = computeCheckHealth({
      checks,
      currentSuccessRates: [metric(down, 0), metric(firing, 1), metric(healthy, 1)],
      reachabilityRates: [metric(firing, 1), metric(healthy, 1)],
      alertStates: {
        [`${down.job}\0${down.target}`]: { firingCount: 2, firingAlertNames: new Set(['a', 'b']) },
        [`${firing.job}\0${firing.target}`]: { firingCount: 1, firingAlertNames: new Set(['c']) },
      },
    });

    expect(summarizeKpis(checkHealth, checks)).toEqual({
      totalChecks: 4,
      disabledChecks: 1,
      downCount: 1,
      firingAlertsCount: 3,
      degradedCount: 0,
      noDataCount: 0,
      healthyCount: 1,
    });
  });
});

describe('matchesFilters', () => {
  it('matches on job and target, case-insensitively', () => {
    const check = buildCheck({ job: 'My API check', target: 'https://api.example.com' });
    const [health] = computeCheckHealth({ checks: [check] });

    expect(matchesFilters(health, 'my api', [])).toBe(true);
    expect(matchesFilters(health, 'EXAMPLE.COM', [])).toBe(true);
    expect(matchesFilters(health, 'unrelated', [])).toBe(false);
  });

  it('filters by check type', () => {
    const check = buildCheck({}, CheckType.Http);
    const [health] = computeCheckHealth({ checks: [check] });

    expect(matchesFilters(health, '', [CheckType.Http])).toBe(true);
    expect(matchesFilters(health, '', [CheckType.Ping])).toBe(false);
  });
});
