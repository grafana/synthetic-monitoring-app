import { DashboardQuerySemanticValues, DashboardQueryTarget } from './types';

const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}

export function formatProbeMatcher(probes: string[]): string {
  if (probes.length === 0) {
    return '.*';
  }

  if (probes.length === 1) {
    return escapeRegex(probes[0]!);
  }

  return probes.map((probe) => escapeRegex(probe)).join('|');
}

function interpolateString(template: string, values: DashboardQuerySemanticValues): string {
  const probeMatcher = formatProbeMatcher(values.probes);

  // Leave $__interval / $__rate_interval for the Prometheus datasource — it derives
  // rate windows from request.intervalMs (pre-substituting the step breaks rate()).
  return template
    .replaceAll('$job', values.job)
    .replaceAll('$instance', values.instance)
    .replaceAll('$probe', probeMatcher)
    .replaceAll('$__range', `${values.rangeSeconds}s`);
}

function interpolateTarget(target: DashboardQueryTarget, values: DashboardQuerySemanticValues): DashboardQueryTarget {
  return {
    ...target,
    expr: target.expr ? interpolateString(target.expr, values) : target.expr,
    query: target.query ? interpolateString(target.query, values) : target.query,
  };
}

export function interpolateTargets(
  targets: DashboardQueryTarget[],
  values: DashboardQuerySemanticValues
): DashboardQueryTarget[] {
  return targets.map((target) => interpolateTarget(target, values));
}
