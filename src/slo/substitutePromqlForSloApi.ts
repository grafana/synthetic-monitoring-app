/**
 * Replace Grafana’s `$__rate_interval` range with a fixed window (e.g. for Explore-only snippets).
 *
 * **Note:** SLO **freeform** create/update validation typically *requires* one of
 * `[$__rate_interval]`, `$__range`, or `$__interval` in the query — do not run this helper on
 * strings you send to the freeform API.
 */
const RATE_MACRO = '[$__rate_interval]';
const SLO_API_RATE_WINDOW = '[5m]';

export function substitutePromqlRateWindowForSloApi(expr: string): string {
  return expr.split(RATE_MACRO).join(SLO_API_RATE_WINDOW);
}
