import React, { useCallback, useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Collapse, LoadingBar, Space, Spinner, Stack, Tag, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { InstantMetric } from 'datasource/responses.types';
import { getStartEnd,queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { ConfirmModal } from 'components/ConfirmModal';

import { ConfigContent } from '../ConfigContent';

// LabelMode mirrors the proto enum values.
const LabelMode = {
  PREFIXED: 0,
  DUAL_WRITE: 1,
  UNPREFIXED: 2,
} as const;

type LabelModeValue = (typeof LabelMode)[keyof typeof LabelMode];

interface LabelModeState {
  mode: LabelModeValue;
  systemLabels: string[];
}

interface CollisionError {
  msg: string;
  collidingLabels: string[];
}

function modeLabel(mode: LabelModeValue): string {
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
function exampleUserLabelPairs(mode: LabelModeValue): Array<{ key: string; value: string; dimmed?: boolean }> {
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
} {
  const metricsDS = useMetricsDS();
  const [labels, setLabels] = useState<Record<string, string> | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!metricsDS?.url) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const { start, end } = getStartEnd();
    try {
      queryInstantMetric<InstantMetric>({
        url: metricsDS.url,
        // topk keeps the response to a single series; the preview only reads one.
        query: 'topk(1, probe_success)',
        start,
        end,
      })
        .then((results) => {
          if (!cancelled && results.length > 0) {
            setLabels(results[0].metric);
          }
        })
        .catch(() => {
          // The preview is best-effort, but a failed query must not be presented
          // as an empty result — record it so the hint can say so.
          if (!cancelled) {
            setFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    } catch {
      // e.g. test environments without runtime
      if (!cancelled) {
        setFailed(true);
        setLoading(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [metricsDS]);

  return { labels, loading, failed };
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
    <Tag
      name={`${name}="${value}"`}
      colorIndex={dimmed ? 9 : 3}
      className={dimmed ? styles.tagDimmed : styles.tag}
    />
  );
}

interface SeriesPreviewProps {
  mode: LabelModeValue;
  styles: ReturnType<typeof getStyles>;
  systemLabels: string[];
  liveLabels?: Record<string, string>;
  liveLoading?: boolean;
  liveFailed?: boolean;
}

/**
 * Shows two label sets side-by-side:
 * 1. A live probe_success series with real system labels from the tenant's data.
 * 2. A constructed example showing how user-defined labels appear in the current mode.
 */
function SeriesPreview({ mode, styles, systemLabels, liveLabels, liveLoading, liveFailed }: SeriesPreviewProps) {
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

  return (
    <div className={styles.previewCard}>
      {/* Series name */}
      <p className={styles.seriesName}>
        <span className={styles.metricName}>probe_success</span>
        {'{'}
        <span className={styles.labelSetInline}>
          {systemLabelKeys.map((k, i) => (
            <span key={k}>
              <span className={styles.labelKey}>{k}</span>=
              <span className={styles.labelVal}>&quot;{systemLabelValues[k]}&quot;</span>
              {i < systemLabelKeys.length - 1 ? ', ' : ''}
            </span>
          ))}
          {userPairs.map((p) => (
            <span key={`${p.key}-${p.dimmed ? 'dim' : 'bright'}`}>
              {', '}
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
        System labels {liveLoading && <Spinner size="xs" inline />}
        {!liveLoading && !liveLabels && liveFailed && (
          <span className={styles.sourceHint}> (example — the live preview query failed)</span>
        )}
        {!liveLoading && !liveLabels && !liveFailed && (
          <span className={styles.sourceHint}> (example — no live data found)</span>
        )}
        {!liveLoading && liveLabels && (
          <span className={styles.sourceHint}> (from your most recent probe_success series)</span>
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
        {mode === LabelMode.DUAL_WRITE && (
          <span className={styles.sourceHint}> (un-prefixed + legacy prefixed)</span>
        )}
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
            ← prefixed form will be removed after finalization
          </Text>
        )}
      </Stack>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LabelMigrationTab() {
  const smDS = useSMDS();
  const styles = useStyles2(getStyles);
  const { labels: liveLabels, loading: liveLoading, failed: liveFailed } = useProbeSuccessLabels();

  const [state, setState] = useState<LabelModeState | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  const [collisionError, setCollisionError] = useState<CollisionError | undefined>(undefined);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetMode: LabelModeValue;
    title: string;
    body: string;
    confirmText: string;
  } | null>(null);
  const [systemLabelsOpen, setSystemLabelsOpen] = useState(false);

  const loadMode = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(undefined);
    smDS
      .getLabelMode()
      .then((data) => {
        if (!cancelled) {
          setState(data as LabelModeState);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message ?? 'Failed to load label migration status');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [smDS]);

  useEffect(loadMode, [loadMode]);

  const applyMode = async (targetMode: LabelModeValue) => {
    setLoading(true);
    setUpdateError(undefined);
    setCollisionError(undefined);
    try {
      const updated = await smDS.setLabelMode(targetMode);
      setState(updated as LabelModeState);
    } catch (err: unknown) {
      const e = err as { data?: CollisionError; message?: string; status?: number };
      if (e?.data?.collidingLabels) {
        setCollisionError(e.data);
      } else {
        setUpdateError(e?.data?.msg ?? e?.message ?? 'Failed to update label migration mode');
      }
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const openConfirm = (
    targetMode: LabelModeValue,
    title: string,
    body: string,
    confirmText = 'Confirm'
  ) => {
    setUpdateError(undefined);
    setCollisionError(undefined);
    setConfirmModal({ isOpen: true, targetMode, title, body, confirmText });
  };

  return (
    <ConfigContent title="Label Migration" loading={loading && !state} ariaLoadingLabel="Loading label mode">
      {loading && state && <LoadingBar width={300} />}

      {loadError && (
        <Alert
          severity="error"
          title="Error loading label migration status"
          onRemove={() => setLoadError(undefined)}
        >
          <Stack direction="column" gap={1}>
            <Text>{loadError}</Text>
            <Button variant="secondary" size="sm" onClick={loadMode} disabled={loading}>
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
                  disabled={loading}
                >
                  Enable dual-write
                </Button>
              </>
            )}

            {state.mode === LabelMode.DUAL_WRITE && (
              <>
                <Alert severity="info" title="Dual-write is active">
                  Labels are being written in both <code>label_foo</code> and <code>foo</code> form. Update your LBAC
                  rules, alert routing, queries, and dashboards to use the un-prefixed names, then finalize when ready.
                  <br />
                  <strong>Note:</strong> dual-write temporarily doubles the label count on{' '}
                  <code>sm_check_info</code> metrics and log streams.
                </Alert>
                <Space v={2} />
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
                  disabled={loading}
                >
                  Finalize migration
                </Button>
              </>
            )}

            {state.mode === LabelMode.UNPREFIXED && (
              <>
                <Alert severity="success" title="Migration complete">
                  Labels now appear without a prefix (e.g. <code>env=&quot;prod&quot;</code>).
                </Alert>
                <Space v={1} />
                <Alert severity="warning" title="Reserved label names are silently ignored">
                  Any user-defined label whose name matches a reserved system label (such as <code>probe</code>,{' '}
                  <code>instance</code>, or <code>job</code>) is silently dropped by the agent. Audit your check and
                  probe labels to ensure none conflict with the reserved names listed below.
                </Alert>
                <Space v={2} />
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
                  disabled={loading}
                >
                  Revert to dual-write
                </Button>
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
            />
          </ConfigContent.Section>

          {updateError && (
            <Alert severity="error" title="Failed to update label migration mode" onRemove={() => setUpdateError(undefined)}>
              <Text>{updateError}</Text>
            </Alert>
          )}

          {collisionError && (
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
          )}

          <ConfigContent.Section title="Reserved system label names">
            <Collapse
              label="Show reserved label names"
              isOpen={systemLabelsOpen}
              onToggle={() => setSystemLabelsOpen((v) => !v)}
            >
              <Text>
                The following label names are reserved by the Synthetic Monitoring agent. User-defined labels with
                these names are rejected at creation time (in dual-write or un-prefixed mode) or silently dropped at
                scrape time.
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
