import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Drawer, Field, Input, Stack, Text } from '@grafana/ui';
import { useTrackingScope } from 'features/tracking/useTrackingScope';

import { CheckType, FeatureName } from 'types';
import { getUserPermissions } from 'data/permissions';
import { QUERY_KEYS } from 'data/useChecks';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useProbes, useProbesWithMetadata } from 'data/useProbes';
import { useDefaultProbeId } from 'hooks/useDefaultProbeId';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';
import { FeatureFlag } from 'components/FeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';

import { createBrokenLinksCheck } from './brokenLinks';
import { useCreateTemplateCheck } from './useCreateTemplateCheck';

export function BrokenLinksDrawer({ onClose }: { onClose: () => void }) {
  return (
    <FeatureFlag name={FeatureName.Folders}>
      {({ isEnabled }) => <BrokenLinksForm onClose={onClose} foldersEnabled={isEnabled} />}
    </FeatureFlag>
  );
}

function BrokenLinksForm({ onClose, foldersEnabled }: { onClose: () => void; foldersEnabled: boolean }) {
  const [url, setUrl] = useState('');
  const [maxLinks, setMaxLinks] = useState('');
  const [folderUid, setFolderUid] = useState<string>();
  const [folderChanged, setFolderChanged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const { data: probes = [], isLoading: probesLoading } = useProbesWithMetadata();
  const { isError: probesError } = useProbes();
  const probeId = useDefaultProbeId(probes, CheckType.Browser);
  const { preselectUid, isPreselectReady } = useFolderSelection({ enabled: foldersEnabled });
  const { status: folderStatus } = useDefaultFolder(foldersEnabled);
  const selectedFolder = folderChanged ? folderUid : preselectUid;
  const { canWriteChecks } = getUserPermissions();
  const isOverlimit = useIsOverlimit(false, CheckType.Browser);
  const mutation = useCreateTemplateCheck();
  const queryClient = useQueryClient();
  const navigateToCheck = useNavigateToCheckDashboard();
  useTrackingScope({ check_template_id: 'broken_links' });
  const disabled =
    !canWriteChecks || isOverlimit !== false || mutation.isPending || probeId === undefined || !isPreselectReady;

  function parseUrl() {
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  async function createCheck(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current || probeId === undefined) {
      return;
    }
    const parsed = parseUrl();
    const nextErrors: Record<string, string> = {};
    if (!parsed) {
      nextErrors.url = 'Enter a valid URL starting with https:// or http://.';
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
    try {
      const result = await mutation.mutateAsync({
        ...check,
        probes: [probeId],
        ...(foldersEnabled && selectedFolder ? { folderUid: selectedFolder } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
      navigateToCheck(result, true);
      onClose();
    } catch {
      // The mutation exposes the API error below and preserves the user's inputs for retry.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Drawer
      title="Detect broken links"
      subtitle="Check a page for broken links on a regular schedule."
      size="md"
      closeOnMaskClick={!mutation.isPending}
      onClose={() => {
        if (!mutation.isPending) {
          onClose();
        }
      }}
    >
      <form onSubmit={createCheck} autoComplete="off" noValidate>
        <Stack direction="column" gap={2}>
          <fieldset
            disabled={mutation.isPending}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0, width: '100%' }}
          >
            <Field label="Page URL" required htmlFor="template-url" error={errors.url} invalid={!!errors.url}>
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
            {foldersEnabled && (
              <Field label="Folder" error={errors.folder} invalid={!!errors.folder}>
                <FolderSelector
                  value={selectedFolder}
                  disabled={mutation.isPending}
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
          <Text color="secondary">Creates a browser check. You can manually edit it afterward.</Text>
          <Stack gap={1}>
            <Button type="submit" disabled={disabled} icon={mutation.isPending ? 'fa fa-spinner' : undefined}>
              Create check
            </Button>
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={onClose}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Drawer>
  );
}
