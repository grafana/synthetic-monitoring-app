import { TimeRange } from '@grafana/data';

import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

export const ADD_TO_NOTEBOOK_COMPONENT_ID = 'grafana/add-to-notebook-form/v2';

export interface CheckNotebookSnapshot {
  cells: Array<{ kind: 'markdown'; text: string }>;
  defaultTitle: string;
}

export interface AddToNotebookFormProps extends CheckNotebookSnapshot {
  onClose: () => void;
  onAdded?: (notebook: { uid: string; title: string; url: string }) => void;
}

interface CheckNotebookContext {
  check: { id: number; job: string };
  checkType: CheckType;
  timeRange: TimeRange;
  timeZone: string;
  probeValues: string[];
  resolvedProbeFilter: string;
  metricsDatasourceUid?: string;
  appSubUrl: string;
  origin: string;
}

export function buildCheckNotebookSnapshot({
  check,
  checkType,
  timeRange,
  timeZone,
  probeValues,
  resolvedProbeFilter,
  metricsDatasourceUid,
  appSubUrl,
  origin,
}: CheckNotebookContext): CheckNotebookSnapshot {
  const from = timeRange.from.toISOString();
  const to = timeRange.to.toISOString();
  const rawFrom = serializeTime(timeRange.raw.from);
  const rawTo = serializeTime(timeRange.raw.to);
  const url = new URL(`${appSubUrl}${generateRoutePath(AppRoutes.CheckDashboard, { id: check.id })}`, origin);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('timezone', timeZone);
  probeValues.forEach((probe) => url.searchParams.append('var-probe', probe));

  const text = [
    '### Synthetic Monitoring check context',
    '',
    `- Check: ${escapeMarkdown(check.job)}`,
    `- Type: ${escapeMarkdown(checkType)}`,
    `- Selected window: ${escapeMarkdown(rawFrom)} → ${escapeMarkdown(rawTo)}`,
    `- Captured window: ${escapeMarkdown(from)} → ${escapeMarkdown(to)}`,
    `- Time zone: ${escapeMarkdown(timeZone)}`,
    `- Probe filter (resolved): ${escapeMarkdown(resolvedProbeFilter)}`,
    ...(metricsDatasourceUid ? [`- Metrics datasource UID: ${escapeMarkdown(metricsDatasourceUid)}`] : []),
    '',
    `[Open check at captured window](<${url.href}>)`,
    '',
    'Context only — no chart, query results, target, request configuration, labels, scripts, or run payloads are captured.',
  ].join('\n');

  return {
    defaultTitle: `Synthetic Monitoring: ${check.job}`,
    cells: [{ kind: 'markdown', text }],
  };
}

function serializeTime(value: TimeRange['raw']['from']): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function escapeMarkdown(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+.!|~-]/g, '\\$&')
    .replace(/[\r\n]/g, ' ');
}
