import type { SLO } from './grafanaSLOApp.types';
import type { Check } from 'types';

export function getSLOQueryStrings(slo: SLO): string[] {
  const q = slo.query;
  if (!q) {
    return [];
  }
  if (q.type === 'ratio' && q.ratio) {
    return [q.ratio.successMetric.prometheusMetric, q.ratio.totalMetric.prometheusMetric].filter(Boolean);
  }
  if (q.type === 'freeform' && q.freeform) {
    return [q.freeform.query].filter(Boolean);
  }
  if (q.type === 'grafanaQueries' && q.grafanaQueries) {
    return q.grafanaQueries.grafanaQueries.map((gq) => gq.expr).filter(Boolean) as string[];
  }
  return [];
}

export function extractLabelValues(query: string, label: string): string[] {
  const re = new RegExp(`${label}=~?"([^"]+)"`, 'g');
  const values: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    values.push(m[1]);
  }
  return values;
}

function isReachabilityQuery(queries: string[]): boolean {
  const combined = queries.join(' ');
  return /\bprobe_all_success_sum\b/.test(combined) && /\bprobe_all_success_count\b/.test(combined);
}

function toJobInstanceKey(job: string, instance: string): string {
  return JSON.stringify([job, instance]);
}

function getLinkedJobInstanceKeys(slo: SLO): Set<string> {
  const keys = new Set<string>();
  const queries = getSLOQueryStrings(slo);
  if (!isReachabilityQuery(queries)) {
    return keys;
  }

  for (const qs of queries) {
    if (!/\bprobe_all_success_sum\b/.test(qs) && !/\bprobe_all_success_count\b/.test(qs)) {
      continue;
    }
    const instances = extractLabelValues(qs, 'instance');
    for (const job of extractLabelValues(qs, 'job')) {
      for (const instance of instances) {
        keys.add(toJobInstanceKey(job, instance));
      }
    }
  }

  return keys;
}

export function sloMatchesSMCheck(slo: SLO, job: string, instance: string): boolean {
  return getLinkedJobInstanceKeys(slo).has(toJobInstanceKey(job, instance));
}

function isSLOActive(slo: SLO): boolean {
  return slo.readOnly?.status?.type !== 'deleting';
}

export type SLOCheckLinkMap = {
  slosByCheckId: Map<number, SLO[]>;
  checksBySLOUuid: Map<string, Check[]>;
};

function hasId(check: Check): check is Check & { id: number } {
  return check.id !== undefined;
}

function appendToMapList<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

export function buildSLOCheckLinkMap(slos: SLO[], checks: Check[]): SLOCheckLinkMap {
  const slosByCheckId = new Map<number, SLO[]>();
  const checksBySLOUuid = new Map<string, Check[]>();
  const checksByJobInstance = new Map<string, Array<Check & { id: number }>>();

  for (const check of checks.filter(hasId)) {
    appendToMapList(checksByJobInstance, toJobInstanceKey(check.job, check.target), check);
  }

  for (const slo of slos.filter(isSLOActive)) {
    for (const key of getLinkedJobInstanceKeys(slo)) {
      for (const check of checksByJobInstance.get(key) ?? []) {
        appendToMapList(slosByCheckId, check.id, slo);
        appendToMapList(checksBySLOUuid, slo.uuid, check);
      }
    }
  }

  return { slosByCheckId, checksBySLOUuid };
}
