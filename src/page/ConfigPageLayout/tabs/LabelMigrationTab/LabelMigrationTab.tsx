import React, { useState } from 'react';
import { Alert, Button, Collapse, Space, Stack, Text } from '@grafana/ui';

import { LabelMode } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useLabelMode, useSetLabelMode } from 'data/useLabelMode';
import { useTenant } from 'data/useTenant';
import { ConfirmModal } from 'components/ConfirmModal';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../../ConfigContent';
import { CollidingLabelRename } from './CollidingLabelRename';
import { getMigrationCooldown } from './migrationCooldown';
import { SeriesPreview } from './SeriesPreview';
import { useCheckInfoLabels } from './useCheckInfoLabels';

interface CollisionError {
  msg: string;
  collidingLabels: string[];
}

function modeLabel(mode: LabelMode): string {
  switch (mode) {
    case LabelMode.Prefixed:
      return 'Prefixed (label_foo)';
    case LabelMode.DualWrite:
      return 'Dual-write (label_foo and foo)';
    case LabelMode.Unprefixed:
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

export function LabelMigrationTab() {
  const { isAdmin } = getUserPermissions();
  const { labels: liveLabels, loading: liveLoading, failed: liveFailed, noDatasource } = useCheckInfoLabels();

  const { data: state, isLoading, error: loadError, refetch, isRefetching } = useLabelMode();
  const setLabelModeMutation = useSetLabelMode();
  const { data: tenant } = useTenant();
  const cooldown = getMigrationCooldown(tenant?.modified, Date.now());

  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  const [collisionError, setCollisionError] = useState<CollisionError | undefined>(undefined);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetMode: LabelMode;
    title: string;
    body: string;
    confirmText: string;
  } | null>(null);
  const [systemLabelsOpen, setSystemLabelsOpen] = useState(false);

  const busy = setLabelModeMutation.isPending;

  const applyMode = async (targetMode: LabelMode) => {
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

  // Deliberately leaves any previous attempt's error visible: the alerts are
  // only replaced by a new attempt's outcome (in applyMode) or dismissed
  // explicitly, so cancelling the modal doesn't discard rename guidance.
  const openConfirm = (targetMode: LabelMode, title: string, body: string, confirmText = 'Confirm') => {
    setConfirmModal({ isOpen: true, targetMode, title, body, confirmText });
  };

  return (
    <ConfigContent title="Label migration" loading={isLoading} ariaLoadingLabel="Loading label mode">
      {!isAdmin && <ContactAdminAlert title="Contact your administrator to change the label migration mode" />}

      {!!loadError && !state && (
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

            {state.mode === LabelMode.Prefixed && (
              <>
                <Text>
                  User-defined labels currently appear with a <code>label_</code> prefix on metrics and logs (e.g.{' '}
                  <code>label_env=&quot;prod&quot;</code>). Enable dual-write to begin your migration to un-prefixed
                  labels. Enabling dual-write is permanent: you cannot return to prefixed-only labels afterwards.
                </Text>
                <Space v={2} />
                {/* While the conflicts alert is up, its "Retry enabling dual-write"
                    button is the only sanctioned path into dual-write. */}
                {isAdmin && !collisionError && (
                  <Button
                    onClick={() =>
                      openConfirm(
                        LabelMode.DualWrite,
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

            {state.mode === LabelMode.DualWrite && (
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
                        LabelMode.Unprefixed,
                        'Finalize migration',
                        'This will switch to un-prefixed labels only; the label_ prefix will no longer appear ' +
                          'on any metrics or logs. Ensure all LBAC rules, alerts, and dashboards have been ' +
                          'updated before proceeding. If you finalize too early, you can revert to dual-write ' +
                          'to temporarily restore the prefixed form.',
                        'Finalize'
                      )
                    }
                    disabled={busy || cooldown.isCoolingDown}
                    tooltip={cooldown.isCoolingDown ? cooldown.message : undefined}
                  >
                    Finalize migration
                  </Button>
                )}
              </>
            )}

            {state.mode === LabelMode.Unprefixed && (
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
                        LabelMode.DualWrite,
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

            {isAdmin && state.mode === LabelMode.DualWrite && cooldown.isCoolingDown && (
              <>
                <Space v={1} />
                <Text color="secondary" variant="bodySmall">
                  {cooldown.message}
                </Text>
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
                    The following labels conflict with reserved system names. Rename them across your checks below, then
                    retry. Labels set on probes are not covered by the rename and must be edited on the probe itself.
                  </Text>
                  <Space v={1} />
                  <CollidingLabelRename
                    labels={collisionError.collidingLabels}
                    systemLabels={state.systemLabels}
                    disabled={!isAdmin}
                    retrying={busy}
                    onRetry={() => applyMode(LabelMode.DualWrite)}
                  />
                </Alert>
              </>
            )}
          </ConfigContent.Section>

          <ConfigContent.Section title="How your labels appear right now">
            <Space v={1} />
            <Text color="secondary">
              This preview shows how an <code>sm_check_info</code> series with two example user-defined check labels (
              <code>env=&quot;prod&quot;</code>, <code>team=&quot;platform&quot;</code>) looks in{' '}
              <strong>{modeLabel(state.mode)}</strong> mode. Execution metrics such as <code>probe_success</code> are
              different: they carry no user-defined labels in prefixed mode, and gain only the un-prefixed form after
              you enable dual-write.
            </Text>
            <Space v={2} />
            <SeriesPreview
              mode={state.mode}
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
