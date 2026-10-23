import React, { useState } from 'react';
import { Alert, Drawer, Field, Input, Stack } from '@grafana/ui';
import { useTrackingScope } from 'features/tracking/useTrackingScope';

import { CheckAlertDraft, CheckType, FeatureName } from 'types';
import { getHttpUrlProtocolSuggestions, validateHttpTarget } from 'validation';
import { AddCheckResult } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useProbes, useProbesWithMetadata } from 'data/useProbes';
import { useDefaultProbeId } from 'hooks/useDefaultProbeId';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';
import { FeatureFlag } from 'components/FeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';
import { ProtocolSuggestionHint } from 'components/ProtocolSuggestionHint';

import { BROKEN_LINKS_CHECK_DEFAULTS, createBrokenLinksCheck } from './brokenLinks';
import { TemplateAlerting } from './TemplateAlerting';
import { BROKEN_LINKS_ALERTS } from './templateAlerts';
import { TemplateSaveControls } from './TemplateSaveControls';
import { useSaveTemplateCheck } from './useSaveTemplateCheck';
import { useTemplateAlerting } from './useTemplateAlerting';

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
  const { data: probes = [], isLoading: probesLoading } = useProbesWithMetadata();
  const { isError: probesError } = useProbes();
  const probeId = useDefaultProbeId(probes, CheckType.Browser);
  const { preselectUid, isPreselectReady } = useFolderSelection({ enabled: foldersEnabled });
  const { status: folderStatus } = useDefaultFolder(foldersEnabled);
  const selectedFolder = folderChanged ? folderUid : preselectUid;
  const { canWriteChecks } = getUserPermissions();
  const isOverlimit = useIsOverlimit(false, CheckType.Browser);
  const navigateToCheck = useNavigateToCheckDashboard();
  useTrackingScope({ check_template_id: 'broken_links' });

  function parseUrl() {
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return undefined;
      }
      return validateHttpTarget(parsed.href) === undefined ? parsed : undefined;
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

  const parsedUrl = parseUrl();
  const draftCheck = parsedUrl ? createBrokenLinksCheck(parsedUrl, {}) : BROKEN_LINKS_CHECK_DEFAULTS;
  const alerting = useTemplateAlerting(draftCheck, alerts);
  const saveState = useSaveTemplateCheck(viewCheck);
  const { busy, createdCheck } = saveState;
  const disabled = !canWriteChecks || isOverlimit !== false || busy || probeId === undefined || !isPreselectReady;

  async function createCheck(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || createdCheck || probeId === undefined) {
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
    const validEmails = alerting.validateEmails();
    if (Object.keys(nextErrors).length || !parsed || !validEmails) {
      return;
    }

    const check = createBrokenLinksCheck(parsed, options);
    await saveState.save(
      {
        ...check,
        probes: [probeId],
        ...(foldersEnabled && selectedFolder ? { folderUid: selectedFolder } : {}),
      },
      alerting.selectedAlerts,
      alerting.emails
    );
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
              inputId="template-url"
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
          {!createdCheck && <TemplateAlerting state={alerting} disabled={busy} />}
          <TemplateSaveControls state={saveState} disabled={disabled} onCancel={onClose} />
        </Stack>
      </form>
    </Drawer>
  );
}
