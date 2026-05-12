import type { SLO } from './useSLOCheckLinks.types';
import type { Check } from 'types';

const SM_METRICS = [/\bprobe_success\b/, /\bprobe_all_success/, /\bsm_http_\w+/, /\bsm_dns_\w+/, /\bsm_ping_\w+/];

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

export function sloMatchesSMCheck(slo: SLO, job: string): boolean {
  const queries = getSLOQueryStrings(slo);
  return queries.some((qs) => SM_METRICS.some((p) => p.test(qs)) && extractLabelValues(qs, 'job').includes(job));
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
      if (check.id !== undefined && sloMatchesSMCheck(slo, check.job)) {
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
