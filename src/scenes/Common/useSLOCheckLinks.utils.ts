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

export function sloMatchesSMCheck(slo: SLO, job: string, instance: string): boolean {
  const queries = getSLOQueryStrings(slo);
  if (!isReachabilityQuery(queries)) {
    return false;
  }
  return queries.some(
    (qs) =>
      (/\bprobe_all_success_sum\b/.test(qs) || /\bprobe_all_success_count\b/.test(qs)) &&
      extractLabelValues(qs, 'job').includes(job) &&
      extractLabelValues(qs, 'instance').includes(instance)
  );
}

function isSLOActive(slo: SLO): boolean {
  return slo.readOnly?.status?.type !== 'deleting';
}

export type SLOCheckLinkMap = {
  slosByCheckId: Map<number, SLO[]>;
  checksBySLOUuid: Map<string, Check[]>;
};

export function buildSLOCheckLinkMap(slos: SLO[], checks: Check[]): SLOCheckLinkMap {
  const slosByCheckId = new Map<number, SLO[]>();
  const checksBySLOUuid = new Map<string, Check[]>();

  const activeSLOs = slos.filter(isSLOActive);

  for (const slo of activeSLOs) {
    for (const check of checks) {
      if (check.id !== undefined && sloMatchesSMCheck(slo, check.job, check.target)) {
        const forCheck = slosByCheckId.get(check.id);
        if (forCheck) {
          forCheck.push(slo);
        } else {
          slosByCheckId.set(check.id, [slo]);
        }

        const forSLO = checksBySLOUuid.get(slo.uuid);
        if (forSLO) {
          forSLO.push(check);
        } else {
          checksBySLOUuid.set(slo.uuid, [check]);
        }
      }
    }
  }

  return { slosByCheckId, checksBySLOUuid };
}
