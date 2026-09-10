import { durationToMilliseconds, parseDuration } from '@grafana/data';

import { Check, CheckAlertDraft } from 'types';
import { getCheckType } from 'utils';
import {
  ALERT_PERIODS,
  PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

type AlertPeriod = (typeof ALERT_PERIODS)[number]['value'];

export interface RecommendedAlert {
  /** The predefined alert this is an instance of, for its display name and unit. */
  definition: PredefinedAlertInterface;
  /** What will be sent to the API. */
  draft: CheckAlertDraft;
}

/**
 * The default per-check alerts for a check's type, with the same thresholds the check editor
 * pre-fills, so setting them up from a recommendation ends in the same place as ticking every
 * box in the editor would.
 *
 * Alerts that evaluate over a period need one at least as long as the check's frequency (the
 * editor greys out anything shorter), so the default period is used when it qualifies and the
 * shortest qualifying one otherwise. A check that runs less often than the longest period gets
 * no such alert rather than an invalid one.
 */
export function getRecommendedAlerts(check: Check): RecommendedAlert[] {
  return PREDEFINED_ALERTS[getCheckType(check.settings)].flatMap((definition) => {
    const draft = toDraft(definition, check.frequency);

    return draft ? [{ definition, draft }] : [];
  });
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

/** The period as the editor labels it (`5m` → `5 min`), falling back to the raw value. */
export function formatAlertPeriod(period: string) {
  return ALERT_PERIODS.find(({ value }) => value === period)?.label ?? period;
}

/** `300ms`, `30d`, or a bare count for alerts that count occurrences. */
export function formatAlertThreshold({ definition, draft }: RecommendedAlert) {
  return definition.unit === 'no.' ? String(draft.threshold) : `${draft.threshold}${definition.unit}`;
}

/**
 * Runs `task` over `items` a few at a time. Applying alerts to every unalerted check is one request
 * per check, and the SM API is a single replica, so a large tenant must not fire hundreds at once.
 */
export async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.allSettled(batch.map(task))));
  }

  return results;
}
