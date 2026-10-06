import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Drawer, Field, Input, Stack } from '@grafana/ui';
import { useTrackingScope } from 'features/tracking/useTrackingScope';

import { CheckAlertDraft, CheckType, FeatureName } from 'types';
import { getHttpUrlProtocolSuggestions } from 'validation';
import { AddCheckResult } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useProbes, useProbesWithMetadata } from 'data/useProbes';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';
import { useDefaultProbeId } from 'hooks/useDefaultProbeId';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';
import { FeatureFlag } from 'components/FeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';
import { ProtocolSuggestionHint } from 'components/ProtocolSuggestionHint';

import { createBrokenLinksCheck } from './brokenLinks';
import { TemplateAlerting } from './TemplateAlerting';
import { BROKEN_LINKS_ALERTS } from './templateAlerts';
import { useCreateTemplateCheck } from './useCreateTemplateCheck';

const URL_FORMAT_ERROR = 'Enter a valid URL starting with https:// or http://.';

export function BrokenLinksDrawer({
  onClose,
  alerts = BROKEN_LINKS_ALERTS,
}: {
  onClose: () => void;
  alerts?: CheckAlertDraft[];
}) {
  return (
    <FeatureFlag name={FeatureName.Folders}>
      {({ isEnabled }) => <BrokenLinksForm onClose={onClose} foldersEnabled={isEnabled} alerts={alerts} />}
    </FeatureFlag>
  );
}

function BrokenLinksForm({
  onClose,
  foldersEnabled,
  alerts,
}: {
  onClose: () => void;
  foldersEnabled: boolean;
  alerts: CheckAlertDraft[];
}) {
  const [url, setUrl] = useState('');
  const [maxLinks, setMaxLinks] = useState('');
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
  const busy = isSubmitting || mutation.isPending || alertMutation.isPending;
  const queryClient = useQueryClient();
  const navigateToCheck = useNavigateToCheckDashboard();
  useTrackingScope({ check_template_id: 'broken_links' });
  const disabled = !canWriteChecks || isOverlimit !== false || busy || probeId === undefined || !isPreselectReady;

  function parseUrl() {
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  const protocolSuggestions = getHttpUrlProtocolSuggestions(url);
  const urlFormatError = url.trim() && !parseUrl() ? URL_FORMAT_ERROR : undefined;
  const urlError = url.trim() ? urlFormatError : errors.url;

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
    const parsed = parseUrl();
    const nextErrors: Record<string, string> = {};
    if (!parsed) {
      nextErrors.url = URL_FORMAT_ERROR;
    }
    if (maxLinks.trim() && (!Number.isSafeInteger(Number(maxLinks)) || Number(maxLinks) < 1)) {
      nextErrors.maxLinks = 'Enter a positive whole number.';
    }
    const options = {
      maxLinks: maxLinks.trim() ? Number(maxLinks) : undefined,
    };
    if (foldersEnabled && folderStatus === 'available' && !selectedFolder) {
      nextErrors.folder = 'Choose a folder.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !parsed) {
      return;
    }

    const check = createBrokenLinksCheck(parsed, options);
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
      title="Detect broken links"
      subtitle="Check a page for broken links on a regular schedule."
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
            <Field label="Page URL" required htmlFor="template-url" error={urlError} invalid={!!urlError}>
              <Input
                id="template-url"
                type="url"
                required
                autoFocus
                placeholder="https://grafana.com"
                value={url}
                onChange={(event) => setUrl(event.currentTarget.value)}
              />
            </Field>
            <ProtocolSuggestionHint
              suggestions={protocolSuggestions}
              onSelect={setUrl}
              disabled={busy || !!createdCheck}
              marginBottom={2}
            />
            {foldersEnabled && (
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
            )}
            <Field
              label="Link limit"
              htmlFor="template-max-links"
              description="Maximum links per run."
              error={errors.maxLinks}
              invalid={!!errors.maxLinks}
            >
              <Input
                id="template-max-links"
                type="number"
                min={1}
                step={1}
                placeholder="10"
                value={maxLinks}
                onChange={(event) => setMaxLinks(event.currentTarget.value)}
              />
            </Field>
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
                <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </form>
    </Drawer>
  );
}
