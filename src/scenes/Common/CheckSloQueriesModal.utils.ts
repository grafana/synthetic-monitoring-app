import { Check } from 'types';
import { sanitizeLabelValue } from 'utils';

export const GRAFANA_SLO_CREATE = 'https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/create/';
export const GRAFANA_SLO_HTTP_API_DOCS =
  'https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/set-up/api/';
export const SLO_OPENAPI_REPO = 'https://github.com/grafana/slo-openapi-client/blob/main/openapi.yaml';
export const SM_UPTIME_DOCS =
  'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/analyze-results/uptime-and-reachability/';

/** Aligned with grafana/terraform-provider-grafana SLO name validation (max 128). */
export const MAX_SLO_NAME = 128;

/** Prometheus label values are limited to ~128 UTF-8 bytes; keep well under to avoid silent truncation. */
export const MAX_LABEL_VALUE_LENGTH = 150;

export const DEFAULT_SLO_TARGET_PERCENT = '99.5';

/** Rolling error-budget windows offered in the MVP UI (days as string for Combobox values). */
export const SLO_WINDOW_DAY_OPTIONS = ['7', '14', '28'] as const;
export type SloWindowDaysChoice = (typeof SLO_WINDOW_DAY_OPTIONS)[number];
export const DEFAULT_SLO_WINDOW_DAYS: SloWindowDaysChoice = '28';

/**
 * When `false`, the label-group flow is hidden in the modal but hooks/queries remain for a future iteration.
 */
export const SHOW_LABEL_GROUP_SLO = false;

/** Single-check MVP uses reachability counters only; uptime uses different metrics — see SM uptime vs reachability docs. */
export const DEFAULT_SLI_TYPE_LABEL = 'Reachability';

export function defaultSloNameForJob(job: string, sliTypeLabel: string = DEFAULT_SLI_TYPE_LABEL): string {
  const suffix = ` (${sliTypeLabel})`;
  const maxMiddle = MAX_SLO_NAME - suffix.length;
  if (maxMiddle < 1) {
    return `…${suffix}`.slice(0, MAX_SLO_NAME);
  }
  const jobPart = job.length <= maxMiddle ? job : `${job.slice(0, Math.max(0, maxMiddle - 1))}…`;
  return `${jobPart}${suffix}`;
}

export function defaultSloGroupNameForJob(job: string, sliTypeLabel: string = DEFAULT_SLI_TYPE_LABEL): string {
  const prefix = 'Group: ';
  const suffix = ` (${sliTypeLabel})`;
  const maxMiddle = MAX_SLO_NAME - prefix.length - suffix.length;
  if (maxMiddle < 1) {
    return `${prefix}…${suffix}`.slice(0, MAX_SLO_NAME);
  }
  const jobPart = job.length <= maxMiddle ? job : `${job.slice(0, Math.max(0, maxMiddle - 1))}…`;
  return `${prefix}${jobPart}${suffix}`;
}

export function grafanaSloManageHref(appSubUrl?: string): string {
  const base = appSubUrl ?? '';
  return `${base}/a/grafana-slo-app/manage-slos`;
}

/** Wizard review step for an existing SLO (uid from create response). */
export function grafanaSloWizardReviewHref(appSubUrl: string | undefined, sloUuid: string): string {
  const base = appSubUrl ?? '';
  return `${base}/a/grafana-slo-app/wizard/review/${sloUuid}`;
}

/** SLO dashboard for one SLO (uid from create response). */
export function grafanaSloDetailDashboardHref(appSubUrl: string | undefined, sloUuid: string): string {
  const base = appSubUrl ?? '';
  return `${base}/d/grafana_slo_app-${sloUuid}/`;
}

export function parseSloTargetPercent(
  input: string
): { ok: true; fraction: number } | { ok: false; message: string } {
  const n = parseFloat(input.trim().replace(/,/g, '').replace(/%/g, ''));
  if (!Number.isFinite(n) || n <= 0 || n >= 100) {
    return { ok: false, message: 'SLO target must be a percentage between 0 and 100 (e.g. 99.5).' };
  }
  return { ok: true, fraction: n / 100 };
}

export function sloWindowChoiceToObjectiveWindow(days: SloWindowDaysChoice): string {
  return `${days}d`;
}

export function parseSloWindowDays(
  input: string
): { ok: true; window: string } | { ok: false; message: string } {
  const n = parseInt(input.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 3650) {
    return { ok: false, message: 'Window must be a whole number of days between 1 and 3650.' };
  }
  return { ok: true, window: `${n}d` };
}

export function isSloWindowDaysChoice(value: string): value is SloWindowDaysChoice {
  return (SLO_WINDOW_DAY_OPTIONS as readonly string[]).includes(value);
}


export function labelsSignature(labels: Check['labels']): string {
  return labels.map((l) => `${l.name}\0${l.value}`).join('\n');
}

export function truncateSloName(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  if (t.length <= MAX_SLO_NAME) {
    return t;
  }
  return `${t.slice(0, MAX_SLO_NAME - 1)}…`;
}

export function sloProvenanceLabels(check: Check): Array<{ key: string; value: string }> {
  const labels: Array<{ key: string; value: string }> = [
    { key: 'source', value: 'grafana-synthetic-monitoring-app' },
  ];
  if (check.id != null) {
    labels.push({ key: 'sm_check_id', value: String(check.id) });
  }
  const job = check.job.length > MAX_LABEL_VALUE_LENGTH ? `${check.job.slice(0, MAX_LABEL_VALUE_LENGTH - 1)}…` : check.job;
  labels.push({ key: 'sm_check_job', value: sanitizeLabelValue(job) });
  return labels;
}
