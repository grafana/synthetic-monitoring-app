import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Space, Spinner, Stack, Tag, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LabelMode } from 'datasource/responses.types';

/**
 * Returns the user-defined label names to show in the mode preview.
 * We use two representative labels so the dual-write case is readable.
 */
const EXAMPLE_USER_LABELS: Record<string, string> = {
  env: 'prod',
  team: 'platform',
};

/** Returns the label key=value pairs as they would appear in the given mode. */
function exampleUserLabelPairs(mode: LabelMode): Array<{ key: string; value: string; dimmed?: boolean }> {
  const pairs: Array<{ key: string; value: string; dimmed?: boolean }> = [];
  for (const [name, val] of Object.entries(EXAMPLE_USER_LABELS)) {
    if (mode === LabelMode.DualWrite) {
      // Un-prefixed first (the "new" form), prefixed second (the legacy form, dimmed)
      pairs.push({ key: name, value: val });
      pairs.push({ key: `label_${name}`, value: val, dimmed: true });
    } else if (mode === LabelMode.Unprefixed) {
      pairs.push({ key: name, value: val });
    } else {
      // PREFIXED
      pairs.push({ key: `label_${name}`, value: val });
    }
  }
  return pairs;
}

interface LabelTagProps {
  name: string;
  value: string;
  dimmed?: boolean;
}

function LabelTag({ name, value, dimmed }: LabelTagProps) {
  const styles = useStyles2(getStyles);
  return (
    <Tag
      name={`${name}="${value}"`}
      colorIndex={dimmed ? 9 : 3}
      className={cx(styles.tag, { [styles.dimmed]: Boolean(dimmed) })}
    />
  );
}

interface SeriesPreviewProps {
  mode: LabelMode;
  systemLabels: string[];
  liveLabels?: Record<string, string>;
  liveLoading?: boolean;
  liveFailed?: boolean;
  noDatasource?: boolean;
}

function previewSourceHint({
  liveLabels,
  liveFailed,
  noDatasource,
}: Pick<SeriesPreviewProps, 'liveLabels' | 'liveFailed' | 'noDatasource'>): string {
  if (liveLabels) {
    return ' (from your most recent sm_check_info series)';
  }
  if (noDatasource) {
    return ' (example — no metrics datasource configured)';
  }
  if (liveFailed) {
    return ' (example — the live preview query failed)';
  }
  return ' (example — no live data found)';
}

/**
 * Shows two label sets side-by-side:
 * 1. A live sm_check_info series with real system labels from the tenant's data.
 * 2. A constructed example showing how user-defined labels appear in the current mode.
 *
 * sm_check_info is previewed (rather than an execution metric such as
 * probe_success) because it is where user-defined labels live: it carries the
 * prefixed form today and both forms in dual-write. Execution metrics never
 * carried prefixed user labels and only gain the un-prefixed form.
 */
export function SeriesPreview({
  mode,
  systemLabels,
  liveLabels,
  liveLoading,
  liveFailed,
  noDatasource,
}: SeriesPreviewProps) {
  const styles = useStyles2(getStyles);

  // System labels from the live series: only keys in the API's reserved set.
  // Anything else on the series (user-defined labels, or agent-emitted labels
  // that are deliberately not reserved) is omitted here — the constructed
  // example below illustrates how user labels appear in each mode.
  const reserved = new Set(systemLabels);
  const systemLabelKeys = liveLabels
    ? Object.keys(liveLabels).filter((k) => !k.startsWith('__') && reserved.has(k))
    : ['probe', 'instance', 'job', 'config_version'];

  const systemLabelValues: Record<string, string> = liveLabels ?? {
    probe: 'dev-local',
    instance: 'grafana.com',
    job: 'my-ping-check',
    config_version: '1721675000000000000',
  };

  const userPairs = exampleUserLabelPairs(mode);

  // One combined list so comma separators are correct even when either
  // side is empty (e.g. a live series with no reserved keys).
  const seriesPairs = [
    ...systemLabelKeys.map((k) => ({ key: k, value: systemLabelValues[k], dimmed: false, system: true })),
    ...userPairs.map((p) => ({ key: p.key, value: p.value, dimmed: Boolean(p.dimmed), system: false })),
  ];

  return (
    <div className={styles.previewCard}>
      {/* Series name */}
      <p className={styles.seriesName}>
        <span className={styles.metricName}>sm_check_info</span>
        {'{'}
        <span className={styles.labelSetInline}>
          {seriesPairs.map((p, i) => (
            <span key={`${p.key}-${p.dimmed ? 'dim' : 'bright'}`}>
              {i > 0 ? ', ' : ''}
              <span className={p.dimmed ? styles.labelKeyDimmed : styles.labelKey}>{p.key}</span>=
              <span className={p.dimmed ? styles.labelValDimmed : styles.labelVal}>&quot;{p.value}&quot;</span>
            </span>
          ))}
        </span>
        {'}'}
      </p>

      <Space v={1.5} />

      {/* Tag pills — system labels */}
      <Text element="p" variant="bodySmall" color="secondary">
        System labels{' '}
        {liveLoading ? (
          <>
            <Spinner size="xs" inline />
            <span className={styles.sourceHint}> (example — loading live data)</span>
          </>
        ) : (
          <span className={styles.sourceHint}>{previewSourceHint({ liveLabels, liveFailed, noDatasource })}</span>
        )}
      </Text>
      <Space v={0.5} />
      <Stack direction="row" gap={1} wrap="wrap">
        {systemLabelKeys.map((k) => (
          <Tag key={k} name={`${k}="${systemLabelValues[k]}"`} colorIndex={6} className={styles.tag} />
        ))}
      </Stack>

      <Space v={1.5} />

      {/* Tag pills — user labels */}
      <Text element="p" variant="bodySmall" color="secondary">
        Your check labels
        {mode === LabelMode.DualWrite && <span className={styles.sourceHint}> (un-prefixed + legacy prefixed)</span>}
      </Text>
      <Space v={0.5} />
      <Stack direction="row" gap={1} wrap="wrap" alignItems="center">
        {userPairs.map((p) => (
          <LabelTag key={`${p.key}-${p.dimmed ? 'dim' : 'bright'}`} name={p.key} value={p.value} dimmed={p.dimmed} />
        ))}
        {mode === LabelMode.DualWrite && (
          <Text variant="bodySmall" color="secondary">
            the prefixed form will be removed after finalization
          </Text>
        )}
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  previewCard: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
  `,
  seriesName: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: 1.6;
    word-break: break-all;
  `,
  metricName: css`
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  labelSetInline: css`
    color: ${theme.colors.text.secondary};
  `,
  labelKey: css`
    color: ${theme.visualization.getColorByName('blue')};
  `,
  labelVal: css`
    color: ${theme.visualization.getColorByName('green')};
  `,
  labelKeyDimmed: css`
    color: ${theme.colors.text.disabled};
  `,
  labelValDimmed: css`
    color: ${theme.colors.text.disabled};
  `,
  tag: css`
    white-space: break-spaces;
    overflow-wrap: anywhere;
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  dimmed: css`
    opacity: 0.45;
  `,
  sourceHint: css`
    font-style: italic;
    color: ${theme.colors.text.secondary};
  `,
});
