import type { Slo } from './useSmCheckSlos.types';

const SM_METRICS = [/\bprobe_success\b/, /\bprobe_all_success/, /\bsm_http_\w+/, /\bsm_dns_\w+/, /\bsm_ping_\w+/];

export function filterSlosByLabel(slos: Slo[], checkId: string): Slo[] {
  return slos.filter((slo) => slo.labels?.some((l) => l.key === 'sm_check_id' && l.value === checkId));
}

/** True when this SLO is explicitly linked to the Synthetic Monitoring check via `sm_check_id`. */
export function isSloLinkedByLabel(slo: Slo, checkId: string): boolean {
  return Boolean(slo.labels?.some((l) => l.key === 'sm_check_id' && l.value === checkId));
}

export function getSloQueryStrings(slo: Slo): string[] {
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

export function sloMatchesSmCheck(slo: Slo, job: string): boolean {
  const queries = getSloQueryStrings(slo);
  return queries.some((qs) => SM_METRICS.some((p) => p.test(qs)) && extractLabelValues(qs, 'job').includes(job));
}

function isSloActive(slo: Slo): boolean {
  return slo.readOnly?.status?.type !== 'deleting';
}

/** Label matches first; query-string fallback for manually-created SLOs; deduped by object identity. Excludes SLOs being deleted. */
export function getMatchingSlosForSmCheck(slos: Slo[], checkId: string, job: string): Slo[] {
  const active = slos.filter(isSloActive);
  const byLabel = filterSlosByLabel(active, checkId);
  const byLabelSet = new Set(byLabel);
  const byQuery = active.filter((slo) => !byLabelSet.has(slo) && sloMatchesSmCheck(slo, job));
  return [...byLabel, ...byQuery];
}
