import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Drawer, Field, Stack } from '@grafana/ui';
import { AdhocFailureExplanation } from 'features/checkInsights/adhoc/AdhocFailureExplanation';
import { trackFaroUserAction } from 'features/tracking/userAction';
import { useTrackingScope } from 'features/tracking/useTrackingScope';

import { BrowserCheck, CheckAlertDraft, CheckTemplateId, CheckType, FeatureName } from 'types';
import { FaroUserAction } from 'faro';
import { AddCheckResult } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useProbes, useProbesWithMetadata } from 'data/useProbes';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';
import { useDefaultProbeId } from 'hooks/useDefaultProbeId';
import { useCanReadLogs } from 'hooks/useDSPermission';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';
import { AdhocResultsList, useAdHocCheck, useAdHocResults } from 'components/Checkster/feature/adhoc-check';
import { INSUFFICIENT_LOG_ACCESS_MESSAGE } from 'components/Checkster/feature/adhoc-check/constants';
import { FeatureFlag } from 'components/FeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';

import { TemplateAlerting } from './TemplateAlerting';
import { useCreateTemplateCheck } from './useCreateTemplateCheck';

export interface TemplateDrawerProps {
  templateId: CheckTemplateId;
  title: string;
  subtitle: string;
  alerts: CheckAlertDraft[];
  onClose: () => void;
  /** Returns field errors keyed by field name. An empty object means the inputs are valid. */
  validate: () => Record<string, string>;
  /** Builds the check from inputs that already passed `validate`. */
  buildCheck: () => BrowserCheck;
  /** Shows a Test button that runs the check once, before it is created. */
  allowTest?: boolean;
  /** Renders the template's fields. The folder field is passed in so each template controls its position. */
  renderFields: (errors: Record<string, string>, folderField: React.ReactNode) => React.ReactNode;
}

export function TemplateDrawer(props: TemplateDrawerProps) {
  return (
    <FeatureFlag name={FeatureName.Folders}>
      {({ isEnabled }) => <TemplateForm {...props} foldersEnabled={isEnabled} />}
    </FeatureFlag>
  );
}

function TemplateForm({
  templateId,
  title,
  subtitle,
  alerts,
  onClose,
  validate,
  buildCheck,
  renderFields,
  allowTest,
  foldersEnabled,
}: TemplateDrawerProps & { foldersEnabled: boolean }) {
  const [folderUid, setFolderUid] = useState<string>();
  const [folderChanged, setFolderChanged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: probes = [], isLoading: probesLoading } = useProbesWithMetadata();
  const { isError: probesError } = useProbes();
  const probeId = useDefaultProbeId(probes, CheckType.Browser);
  const { preselectUid, isPreselectReady } = useFolderSelection({ enabled: foldersEnabled });
  const { status: folderStatus } = useDefaultFolder(foldersEnabled);
  const selectedFolder = folderChanged ? folderUid : preselectUid;
  const { canWriteChecks } = getUserPermissions();
  const isOverlimit = useIsOverlimit(false, CheckType.Browser);
  const mutation = useCreateTemplateCheck();
  const alertMutation = useUpdateAlertsForCheck();
  const { canWriteAlerts } = useAlertAccessControl();
  const [createdCheck, setCreatedCheck] = useState<AddCheckResult>();
  const [testedCheck, setTestedCheck] = useState<BrowserCheck>();
  const busy = isSubmitting || mutation.isPending || alertMutation.isPending;
  const queryClient = useQueryClient();
  const navigateToCheck = useNavigateToCheckDashboard();
  useTrackingScope({ check_template_id: templateId });
  const canReadLogs = useCanReadLogs();
  const testMutation = useAdHocCheck();
  const { items: testResults, hasPendingChecks } = useAdHocResults(testMutation.data);
  const testing = testMutation.isPending || hasPendingChecks;
  const folderField = foldersEnabled && (
    <Field label="Folder" error={errors.folder} invalid={!!errors.folder}>
      <FolderSelector
        value={selectedFolder}
        disabled={busy || !!createdCheck}
        onChange={(value) => {
          setFolderChanged(true);
          setFolderUid(value);
        }}
      />
    </Field>
  );
  const disabled = !canWriteChecks || isOverlimit !== false || busy || probeId === undefined || !isPreselectReady;

  function testCheck() {
    if (probeId === undefined) {
      return;
    }
    // The folder is only needed to save the check, not to run it.
    const { folder: _folder, ...nextErrors } = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    trackFaroUserAction(FaroUserAction.AdhocCheckTestClicked);
    const check = buildCheck();
    setTestedCheck(check);
    testMutation.mutate({ ...check, probes: [probeId] });
  }

  function viewCheck(check: AddCheckResult) {
    navigateToCheck(check, true);
    onClose();
  }

  async function enableAlerts(check: AddCheckResult) {
    try {
      await alertMutation.mutateAsync({ checkId: check.id!, alerts });
    } catch {
      return; // Preserve the created check so retry only updates its alerts.
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    viewCheck(check);
  }

  async function retryAlerts(check: AddCheckResult) {
    if (submitting.current || !canWriteAlerts) {
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      await enableAlerts(check);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  async function createCheck(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current || createdCheck || probeId === undefined) {
      return;
    }
    const nextErrors = validate();
    if (foldersEnabled && folderStatus === 'available' && !selectedFolder) {
      nextErrors.folder = 'Choose a folder.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    const check = buildCheck();
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const result = await mutation.mutateAsync({
        ...check,
        probes: [probeId],
        ...(foldersEnabled && selectedFolder ? { folderUid: selectedFolder } : {}),
      });
      setCreatedCheck(result);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      if (canWriteAlerts) {
        await enableAlerts(result);
      } else {
        viewCheck(result);
      }
    } catch {
      // The mutation exposes the API error below and preserves the user's inputs for retry.
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer
      title={title}
      subtitle={subtitle}
      size="md"
      closeOnMaskClick={!busy}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
    >
      <form onSubmit={createCheck} autoComplete="off" noValidate>
        <Stack direction="column" gap={2}>
          <fieldset
            disabled={busy || !!createdCheck}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0, width: '100%' }}
          >
            {renderFields(errors, folderField)}
          </fieldset>
          {!probesLoading && !probesError && probeId === undefined && (
            <Alert title="No compatible probe available" severity="error">
              A probe that supports browser checks is required to create this check.
            </Alert>
          )}
          {probesError && (
            <Alert title="Unable to load probes" severity="error">
              Try again once probes are available.
            </Alert>
          )}
          {mutation.isError && (
            <Alert title="Unable to create check" severity="error">
              {mutation.error?.message || 'Please try again.'}
            </Alert>
          )}
          {createdCheck && alertMutation.isError ? (
            <Alert title="Check created, but alerting couldn’t be enabled" severity="warning">
              {alertMutation.error?.message || 'Try enabling alerting again, or open the check to configure it later.'}
            </Alert>
          ) : null}
          {!createdCheck && <TemplateAlerting />}
          <Stack gap={1}>
            {createdCheck && alertMutation.isError ? (
              <>
                <Button type="button" disabled={busy || !canWriteAlerts} onClick={() => retryAlerts(createdCheck)}>
                  Retry enabling alerting
                </Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => viewCheck(createdCheck)}>
                  View check
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" disabled={disabled} icon={busy ? 'fa fa-spinner' : undefined}>
                  Create check
                </Button>
                {allowTest && (
                  <Button
                    type="button"
                    variant="secondary"
                    icon={testing ? 'fa fa-spinner' : undefined}
                    disabled={busy || testing || !canWriteChecks || probeId === undefined || !canReadLogs}
                    tooltip={!canReadLogs ? INSUFFICIENT_LOG_ACCESS_MESSAGE : undefined}
                    onClick={testCheck}
                  >
                    Test
                  </Button>
                )}
                <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}
          </Stack>
          {testMutation.isError && (
            <Alert title="Unable to test check" severity="error">
              {testMutation.error?.message || 'Please try again.'}
            </Alert>
          )}
          {testedCheck && testResults.length > 0 && !testMutation.isPending && (
            <AdhocFailureExplanation run={testResults[testResults.length - 1]} check={testedCheck} />
          )}
          {testResults.length > 0 && <AdhocResultsList items={testResults} />}
        </Stack>
      </form>
    </Drawer>
  );
}
