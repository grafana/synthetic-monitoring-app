import React, { useCallback, useState } from 'react';
import { Alert, Button, Collapse, ConfirmModal, LoadingBar, Space, Stack, Text } from '@grafana/ui';

import { useSMDS } from 'hooks/useSMDS';

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

export function LabelMigrationTab() {
  const smDS = useSMDS();

  const [state, setState] = useState<LabelModeState | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
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

  // Load on mount.
  React.useEffect(loadMode, [loadMode]);

  const applyMode = async (targetMode: LabelModeValue) => {
    setLoading(true);
    setLoadError(undefined);
    setCollisionError(undefined);
    try {
      const updated = await smDS.setLabelMode(targetMode);
      setState(updated as LabelModeState);
    } catch (err: unknown) {
      const e = err as { data?: CollisionError; message?: string; status?: number };
      if (e?.data?.collidingLabels) {
        setCollisionError(e.data);
      } else {
        setLoadError(e?.message ?? 'Failed to update label migration mode');
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
    confirmText: string = 'Confirm'
  ) => {
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
                  labels. You can revert dual-write at any time before finalizing.
                </Text>
                <Space v={2} />
                <Button
                  onClick={() =>
                    openConfirm(
                      LabelMode.DUAL_WRITE,
                      'Enable dual-write',
                      'This will begin writing labels in both prefixed (label_foo) and un-prefixed (foo) form. ' +
                        'Your existing LBAC rules, alerts, and dashboards will continue to work during this period. ' +
                        'You can revert this change at any time until you finalize the migration.',
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
                <Stack direction="row" gap={2}>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      openConfirm(
                        LabelMode.PREFIXED,
                        'Revert to prefixed labels',
                        'This will revert to writing labels with the label_ prefix only. ' +
                          'Any rules or queries you have already migrated to un-prefixed form will stop working.',
                        'Revert'
                      )
                    }
                    disabled={loading}
                  >
                    Revert to prefixed
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      openConfirm(
                        LabelMode.UNPREFIXED,
                        'Finalize migration',
                        'This will permanently switch to un-prefixed labels only. ' +
                          'The label_ prefix will no longer appear on any metrics or logs. ' +
                          'This cannot be undone — ensure all LBAC rules, alerts, and dashboards ' +
                          'have been updated before proceeding.',
                        'Finalize'
                      )
                    }
                    disabled={loading}
                  >
                    Finalize migration
                  </Button>
                </Stack>
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
              </>
            )}
          </ConfigContent.Section>

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
