import { durationToMilliseconds, parseDuration } from '@grafana/data';

import { Check, CheckAlertDraft, CheckAlertType } from 'types';
import { getCheckType } from 'utils';
import {
  ALERT_PERIODS,
  PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

type AlertPeriod = (typeof ALERT_PERIODS)[number]['value'];

export interface RecommendedAlert {
  definition: PredefinedAlertInterface;
  draft: CheckAlertDraft;
}

// The editor's defaults, so this ends in the same place as ticking every box there. A period must
// be at least the check's frequency (the editor greys out shorter ones); none qualifying means no alert.
export function getRecommendedAlerts(check: Check): RecommendedAlert[] {
  return PREDEFINED_ALERTS[getCheckType(check.settings)].flatMap((definition) => {
    if (!isAlertEligible(definition, check)) {
      return [];
    }

    const draft = toDraft(definition, check.frequency);

    return draft ? [{ definition, draft }] : [];
  });
}

// Mirrors the editor's refinements: an alert the form would reject must not be offered here
// either. A TCP check without TLS collects no certificate metrics, so the expiry alert cannot
// fire (see tcpTLSTargetCertificateCloseToExpiringRefinement in schemas/general/CheckAlerts.ts).
function isAlertEligible(definition: PredefinedAlertInterface, check: Check): boolean {
  if (definition.type !== CheckAlertType.TLSTargetCertificateCloseToExpiring) {
    return true;
  }

  return !('tcp' in check.settings) || Boolean(check.settings.tcp.tls);
}

function toDraft(definition: PredefinedAlertInterface, frequency: number): CheckAlertDraft | undefined {
  const { threshold, period } = definition.defaultValues;

  if (!definition.supportsPeriod) {
    return { name: definition.type, threshold };
  }

  const validPeriod = getShortestValidPeriod(frequency, period);

  return validPeriod ? { name: definition.type, threshold, period: validPeriod } : undefined;
}

function getShortestValidPeriod(frequency: number, preferred?: AlertPeriod): AlertPeriod | undefined {
  const isValid = (period: AlertPeriod) => durationToMilliseconds(parseDuration(period)) >= frequency;

  if (preferred && isValid(preferred)) {
    return preferred;
  }

  return ALERT_PERIODS.map(({ value }) => value).find(isValid);
}

// `5m` → `5 min`, as the editor labels it.
export function formatAlertPeriod(period: string) {
  return ALERT_PERIODS.find(({ value }) => value === period)?.label ?? period;
}

// `300ms`, `30d`, or a bare count.
export function formatAlertThreshold({ definition, draft }: RecommendedAlert) {
  return definition.unit === 'no.' ? String(draft.threshold) : `${draft.threshold}${definition.unit}`;
}

// One request per check against a single-replica API, so a large tenant must not fire hundreds at
// once. `isCancelled` stops scheduling further batches once the caller has gone away: in-flight
// requests still finish, but a panel that unmounted mid-run leaves no loop behind it to collide
// with the next one. Items never submitted are reported as rejected so callers do not count them
// as done.
export async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>,
  isCancelled: () => boolean = () => false
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let index = 0; index < items.length; index += batchSize) {
    if (isCancelled()) {
      const remaining = items.length - results.length;

      return [
        ...results,
        ...Array.from({ length: remaining }, () => ({ status: 'rejected' as const, reason: new Error('cancelled') })),
      ];
    }

    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.allSettled(batch.map(task))));
  }

  return results;
}

export interface AlertPlan {
  check: Check;
  alerts: RecommendedAlert[];
}

/**
 * The checks this finding can actually act on. A check slower than the longest alert period has
 * no valid default alert, and one in a folder the user cannot edit would 403. Shared so the
 * landing row's call to action and the panel's bulk apply cannot promise different things.
 */
export function getAlertPlans(checks: Check[], canWrite: (check: Check) => boolean): AlertPlan[] {
  return checks
    .map((check) => ({ check, alerts: getRecommendedAlerts(check) }))
    .filter((plan) => plan.alerts.length > 0 && canWrite(plan.check));
}
