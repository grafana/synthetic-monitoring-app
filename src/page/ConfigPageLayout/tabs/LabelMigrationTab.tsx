import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Collapse, Space, Spinner, Stack, Tag, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { InstantMetric } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useLabelMode, useSetLabelMode } from 'data/useLabelMode';
import { getStartEnd, queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { ConfirmModal } from 'components/ConfirmModal';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../ConfigContent';

// LabelMode mirrors the proto enum values.
const LabelMode = {
  PREFIXED: 0,
  DUAL_WRITE: 1,
  UNPREFIXED: 2,
} as const;

interface CollisionError {
  msg: string;
  collidingLabels: string[];
}

function modeLabel(mode: number): string {
  switch (mode) {
    case LabelMode.PREFIXED:
      return 'Prefixed (label_foo)';
    case LabelMode.DUAL_WRITE:
      return 'Dual-write (label_foo and foo)';
    case LabelMode.UNPREFIXED:
      return 'Unprefixed (foo only)';
    default:
      return 'Unknown';
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  // fetchAPI rejects with a Grafana FetchError, whose useful content is in
  // `data` (the API's response body), not in an Error-style `message`.
  const e = err as { data?: { msg?: string } };
  return e?.data?.msg ?? fallback;
}

// ─── Label preview helpers ──────────────────────────────────────────────────

/**
 * Returns the user-defined label names to show in the mode preview.
 * We use two representative labels so the dual-write case is readable.
 */
const EXAMPLE_USER_LABELS: Record<string, string> = {
  env: 'prod',
  team: 'platform',
};

/** Returns the label key=value pairs as they would appear in the given mode. */
function exampleUserLabelPairs(mode: number): Array<{ key: string; value: string; dimmed?: boolean }> {
  const pairs: Array<{ key: string; value: string; dimmed?: boolean }> = [];
  for (const [name, val] of Object.entries(EXAMPLE_USER_LABELS)) {
    if (mode === LabelMode.DUAL_WRITE) {
      // Un-prefixed first (the "new" form), prefixed second (the legacy form, dimmed)
      pairs.push({ key: name, value: val });
      pairs.push({ key: `label_${name}`, value: val, dimmed: true });
    } else if (mode === LabelMode.UNPREFIXED) {
      pairs.push({ key: name, value: val });
    } else {
      // PREFIXED
      pairs.push({ key: `label_${name}`, value: val });
    }
  }
  return pairs;
}

// ─── Live probe_success label fetch ─────────────────────────────────────────

/** Fetches a single probe_success series to show real system labels from the tenant's data. */
function useProbeSuccessLabels(): {
  labels: Record<string, string> | undefined;
  loading: boolean;
  failed: boolean;
  noDatasource: boolean;
} {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url ?? '';
  // topk keeps the response to a single series; the preview only reads one.
  const query = 'topk(1, probe_success)';

  const { data, isLoading, isError } = useQuery({
    // getStartEnd() is time-dependent, so it can't be part of the query key
    // without causing continuous refetches.
     
    queryKey: ['labelMigrationSeriesPreview', query, url],
    queryFn: () => queryInstantMetric<InstantMetric>({ url, query, ...getStartEnd() }),
    enabled: Boolean(metricsDS),
    retry: false,
  });

  return {
    labels: data && data.length > 0 ? data[0].metric : undefined,
    loading: isLoading,
    failed: isError,
    noDatasource: !metricsDS,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface LabelTagProps {
  name: string;
  value: string;
  dimmed?: boolean;
  styles: ReturnType<typeof getStyles>;
}

function LabelTag({ name, value, dimmed, styles }: LabelTagProps) {
  return (
    <Tag name={`${name}="${value}"`} colorIndex={dimmed ? 9 : 3} className={dimmed ? styles.tagDimmed : styles.tag} />
  );
}

interface SeriesPreviewProps {
  mode: number;
  styles: ReturnType<typeof getStyles>;
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
    return ' (from your most recent probe_success series)';
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
 * 1. A live probe_success series with real system labels from the tenant's data.
 * 2. A constructed example showing how user-defined labels appear in the current mode.
 */
function SeriesPreview({
  mode,
  styles,
  systemLabels,
  liveLabels,
  liveLoading,
  liveFailed,
  noDatasource,
}: SeriesPreviewProps) {
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
        <span className={styles.metricName}>probe_success</span>
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
        {mode === LabelMode.DUAL_WRITE && <span className={styles.sourceHint}> (un-prefixed + legacy prefixed)</span>}
      </Text>
      <Space v={0.5} />
      <Stack direction="row" gap={1} wrap="wrap" alignItems="center">
        {userPairs.map((p) => (
          <LabelTag
            key={`${p.key}-${p.dimmed ? 'dim' : 'bright'}`}
            name={p.key}
            value={p.value}
            dimmed={p.dimmed}
            styles={styles}
          />
        ))}
        {mode === LabelMode.DUAL_WRITE && (
          <Text variant="bodySmall" color="secondary">
            the prefixed form will be removed after finalization
          </Text>
        )}
      </Stack>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LabelMigrationTab() {
  const styles = useStyles2(getStyles);
  const { isAdmin } = getUserPermissions();
  const { labels: liveLabels, loading: liveLoading, failed: liveFailed, noDatasource } = useProbeSuccessLabels();

  const { data: state, isLoading, error: loadError, refetch, isRefetching } = useLabelMode();
  const setLabelModeMutation = useSetLabelMode();

  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  const [collisionError, setCollisionError] = useState<CollisionError | undefined>(undefined);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetMode: number;
    title: string;
    body: string;
    confirmText: string;
  } | null>(null);
  const [systemLabelsOpen, setSystemLabelsOpen] = useState(false);

  const busy = setLabelModeMutation.isPending;

  const applyMode = async (targetMode: number) => {
    setUpdateError(undefined);
    setCollisionError(undefined);
    try {
      await setLabelModeMutation.mutateAsync(targetMode);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: CollisionError };
      if (e?.status === 409 && e?.data?.collidingLabels) {
        setCollisionError(e.data);
      } else {
        setUpdateError(getErrorMessage(err, 'Failed to update label migration mode'));
      }
    } finally {
      setConfirmModal(null);
    }
  };

  const openConfirm = (targetMode: number, title: string, body: string, confirmText = 'Confirm') => {
    setUpdateError(undefined);
    setCollisionError(undefined);
    setConfirmModal({ isOpen: true, targetMode, title, body, confirmText });
  };

  return (
    <ConfigContent title="Label Migration" loading={isLoading} ariaLoadingLabel="Loading label mode">
      {!isAdmin && <ContactAdminAlert title="Contact your administrator to change the label migration mode" />}

      {Boolean(loadError) && !state && (
        <Alert severity="error" title="Error loading label migration status">
          <Stack direction="column" gap={1}>
            <Text>{getErrorMessage(loadError, 'Failed to load label migration status')}</Text>
            <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              Retry
            </Button>
          </Stack>
        </Alert>
      )}

      {state && (
        <>
          <ConfigContent.Section title="Current status">
            <Space v={1} />
            <Text>
              Current mode: <strong>{modeLabel(state.mode)}</strong>
            </Text>
            <Space v={2} />

            {state.mode === LabelMode.PREFIXED && (
              <>
                <Text>
                  User-defined labels currently appear with a <code>label_</code> prefix on metrics and logs (e.g.{' '}
                  <code>label_env=&quot;prod&quot;</code>). Enable dual-write to begin your migration to un-prefixed
                  labels. Enabling dual-write is permanent: you cannot return to prefixed-only labels afterwards.
                </Text>
                <Space v={2} />
                {isAdmin && (
                  <Button
                    onClick={() =>
                      openConfirm(
                        LabelMode.DUAL_WRITE,
                        'Enable dual-write',
                        'This will begin writing labels in both prefixed (label_foo) and un-prefixed (foo) form. ' +
                          'Your existing LBAC rules, alerts, and dashboards will continue to work during this period. ' +
                          'This step cannot be undone — once dual-write is enabled you cannot return to ' +
                          'prefixed-only labels.',
                        'Enable dual-write'
                      )
                    }
                    disabled={busy}
                  >
                    Enable dual-write
                  </Button>
                )}
              </>
            )}

            {state.mode === LabelMode.DUAL_WRITE && (
              <>
                <Alert severity="info" title="Dual-write is active">
                  Labels are being written in both <code>label_foo</code> and <code>foo</code> form. Update your LBAC
                  rules, alert routing, queries, and dashboards to use the un-prefixed names, then finalize when ready.
                  <br />
                  <strong>Note:</strong> dual-write temporarily doubles the label count on <code>sm_check_info</code>{' '}
                  metrics and log streams.
                </Alert>
                <Space v={2} />
                {isAdmin && (
                  <Button
                    onClick={() =>
                      openConfirm(
                        LabelMode.UNPREFIXED,
                        'Finalize migration',
                        'This will switch to un-prefixed labels only; the label_ prefix will no longer appear ' +
                          'on any metrics or logs. Ensure all LBAC rules, alerts, and dashboards have been ' +
                          'updated before proceeding. If you finalize too early, you can revert to dual-write ' +
                          'to temporarily restore the prefixed form.',
                        'Finalize'
                      )
                    }
                    disabled={busy}
                  >
                    Finalize migration
                  </Button>
                )}
              </>
            )}

            {state.mode === LabelMode.UNPREFIXED && (
              <>
                <Alert severity="success" title="Migration complete">
                  Labels now appear without a prefix (e.g. <code>env=&quot;prod&quot;</code>).
                </Alert>
                <Space v={1} />
                <Alert severity="info" title="Reserved label names are enforced">
                  User-defined labels whose names match a reserved system label (such as <code>probe</code>,{' '}
                  <code>instance</code>, or <code>job</code>) are rejected when creating or updating checks and probes.
                  Should one slip through, the agent drops it at scrape time as a backstop. The full list of reserved
                  names is below.
                </Alert>
                <Space v={2} />
                {isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      openConfirm(
                        LabelMode.DUAL_WRITE,
                        'Revert to dual-write',
                        'This will temporarily restore the prefixed (label_foo) form alongside the un-prefixed ' +
                          'form, so that policies still relying on prefixed labels keep working while you finish ' +
                          'migrating them. You can finalize again at any time.',
                        'Revert to dual-write'
                      )
                    }
                    disabled={busy}
                  >
                    Revert to dual-write
                  </Button>
                )}
              </>
            )}

            {updateError && (
              <>
                <Space v={2} />
                <Alert
                  severity="error"
                  title="Failed to update label migration mode"
                  onRemove={() => setUpdateError(undefined)}
                >
                  <Text>{updateError}</Text>
                </Alert>
              </>
            )}

            {collisionError && (
              <>
                <Space v={2} />
                <Alert
                  severity="error"
                  title="Label name conflicts — cannot enable dual-write"
                  onRemove={() => setCollisionError(undefined)}
                >
                  <Text>
                    The following labels conflict with reserved system names. Rename or remove them from your checks and
                    probes, then try again:
                  </Text>
                  <Space v={1} />
                  <ul>
                    {collisionError.collidingLabels.map((name) => (
                      <li key={name}>
                        <code>{name}</code>
                      </li>
                    ))}
                  </ul>
                </Alert>
              </>
            )}
          </ConfigContent.Section>

          {/* ── Label preview ────────────────────────────────────────────── */}
          <ConfigContent.Section title="How your labels appear right now">
            <Space v={1} />
            <Text color="secondary">
              This preview shows how a <code>probe_success</code> series with two example user-defined check labels (
              <code>env=&quot;prod&quot;</code>, <code>team=&quot;platform&quot;</code>) looks in{' '}
              <strong>{modeLabel(state.mode)}</strong> mode.
            </Text>
            <Space v={2} />
            <SeriesPreview
              mode={state.mode}
              styles={styles}
              systemLabels={state.systemLabels}
              liveLabels={liveLabels}
              liveLoading={liveLoading}
              liveFailed={liveFailed}
              noDatasource={noDatasource}
            />
          </ConfigContent.Section>

          <ConfigContent.Section title="Reserved system label names">
            <Collapse
              label="Show reserved label names"
              isOpen={systemLabelsOpen}
              onToggle={() => setSystemLabelsOpen((v) => !v)}
            >
              <Text>
                The following label names are reserved by the Synthetic Monitoring agent. User-defined labels with these
                names are rejected at creation time (in dual-write or un-prefixed mode) or silently dropped at scrape
                time.
              </Text>
              <Space v={1} />
              <ul>
                {state.systemLabels.map((name) => (
                  <li key={name}>
                    <code>{name}</code>
                  </li>
                ))}
              </ul>
            </Collapse>
          </ConfigContent.Section>
        </>
      )}

      {confirmModal && (
        <ConfirmModal
          async
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          body={confirmModal.body}
          confirmText={confirmModal.confirmText}
          onConfirm={() => applyMode(confirmModal.targetMode)}
          onDismiss={() => setConfirmModal(null)}
        />
      )}
    </ConfigContent>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  tagDimmed: css`
    white-space: break-spaces;
    overflow-wrap: anywhere;
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
    opacity: 0.45;
  `,
  sourceHint: css`
    font-style: italic;
    color: ${theme.colors.text.secondary};
  `,
});
