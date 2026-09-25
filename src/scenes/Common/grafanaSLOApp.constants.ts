import { config } from '@grafana/runtime';

import type { SLO } from './grafanaSLOApp.types';

/** Grafana app plugin id for `grafana-slo-app`. */
export const SLO_APP_PLUGIN_ID = 'grafana-slo-app';

/** Registered by grafana-slo-app via `addFunction`; resolves to RTK Query `sloApi` bundle. */
export const SLO_APP_API_EXTENSION_POINT_ID = `${SLO_APP_PLUGIN_ID}/slo-api/v1`;

/** Registered by grafana-slo-app via `addComponent`; SLO create/edit wizard. */
export const SLO_WIZARD_COMPONENT_ID = `${SLO_APP_PLUGIN_ID}/wizard/v1`;

/**
 * Native SLO wizard edit URL (`/wizard/review/:uuid`), matching the SLO list Edit button.
 * Inline edit via the exposed wizard needs grafana/slo#4781; until that ships, send users here.
 */
export function buildSLOEditHref(uuid: string): string {
  const appSubUrl = config.appSubUrl ?? '';
  return `${appSubUrl}/a/${SLO_APP_PLUGIN_ID}/wizard/review/${encodeURIComponent(uuid)}`;
}

export function buildSLODashboardHref(slo: SLO): string | undefined {
  const dashboardUid = slo.readOnly?.drillDownDashboardRef?.UID;
  return dashboardUid ? `${config.appSubUrl ?? ''}/d/${dashboardUid}` : undefined;
}
