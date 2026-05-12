import type { SLO } from './useSmCheckSLOs.types';

const SM_METRICS = [/\bprobe_success\b/, /\bprobe_all_success/, /\bsm_http_\w+/, /\bsm_dns_\w+/, /\bsm_ping_\w+/];

export function filterSLOsByLabel(slos: SLO[], checkId: string): SLO[] {
  return slos.filter((slo) => slo.labels?.some((l) => l.key === 'sm_check_id' && l.value === checkId));
}

/** True when this SLO is explicitly linked to the Synthetic Monitoring check via `sm_check_id`. */
export function isSLOLinkedByLabel(slo: SLO, checkId: string): boolean {
  return Boolean(slo.labels?.some((l) => l.key === 'sm_check_id' && l.value === checkId));
}

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

export function sloMatchesSmCheck(slo: SLO, job: string): boolean {
  const queries = getSLOQueryStrings(slo);
  return queries.some((qs) => SM_METRICS.some((p) => p.test(qs)) && extractLabelValues(qs, 'job').includes(job));
}

function isSLOActive(slo: SLO): boolean {
  return slo.readOnly?.status?.type !== 'deleting';
}

/** Label matches first; query-string fallback for manually-created SLOs; deduped by object identity. Excludes SLOs being deleted. */
export function getMatchingSLOsForSmCheck(slos: SLO[], checkId: string, job: string): SLO[] {
  const active = slos.filter(isSLOActive);
  const byLabel = filterSLOsByLabel(active, checkId);
  const byLabelSet = new Set(byLabel);
  const byQuery = active.filter((slo) => !byLabelSet.has(slo) && sloMatchesSmCheck(slo, job));
  return [...byLabel, ...byQuery];
}
