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
  definition: PredefinedAlertInterface;
  draft: CheckAlertDraft;
}

// The editor's defaults, so this ends in the same place as ticking every box there. A period must
// be at least the check's frequency (the editor greys out shorter ones); none qualifying means no alert.
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

// `5m` → `5 min`, as the editor labels it.
export function formatAlertPeriod(period: string) {
  return ALERT_PERIODS.find(({ value }) => value === period)?.label ?? period;
}

// `300ms`, `30d`, or a bare count.
export function formatAlertThreshold({ definition, draft }: RecommendedAlert) {
  return definition.unit === 'no.' ? String(draft.threshold) : `${draft.threshold}${definition.unit}`;
}

// One request per check against a single-replica API, so a large tenant must not fire hundreds at once.
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
