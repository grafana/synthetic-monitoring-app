import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Checkbox, Combobox, Drawer, Field, Input, Stack, Text } from '@grafana/ui';
import { useTrackingScope } from 'features/tracking/useTrackingScope';
import { jobSchema } from 'schemas/general/Job';

import { CheckType, FeatureName } from 'types';
import { getUserPermissions } from 'data/permissions';
import { QUERY_KEYS, useCreateCheck } from 'data/useChecks';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useProbes, useProbesWithMetadata } from 'data/useProbes';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useNavigateToCheckDashboard } from 'hooks/useNavigateToCheckDashboard';
import { getAvailableProbes } from 'components/CheckEditor/ProbeOptions';
import { FeatureFlag } from 'components/FeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';

import { createBrokenLinksCheck } from './brokenLinks';

export function BrokenLinksDrawer({ onClose }: { onClose: () => void }) {
  return (
    <FeatureFlag name={FeatureName.Folders}>
      {({ isEnabled }) => <BrokenLinksForm onClose={onClose} foldersEnabled={isEnabled} />}
    </FeatureFlag>
  );
}

function BrokenLinksForm({ onClose, foldersEnabled }: { onClose: () => void; foldersEnabled: boolean }) {
  const [url, setUrl] = useState('');
  const [job, setJob] = useState('');
  const suggestedName = useRef('');
  const [maxLinks, setMaxLinks] = useState('10');
  const [timeout, setLinkTimeout] = useState('10');
  const [statuses, setStatuses] = useState('200');
  const [failOnBroken, setFailOnBroken] = useState(true);
  const [probeId, setProbeId] = useState<number>();
  const [folderUid, setFolderUid] = useState<string>();
  const [folderChanged, setFolderChanged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const { data: probes = [], isLoading: probesLoading } = useProbesWithMetadata();
  const { isError: probesError } = useProbes();
  const availableProbes = getAvailableProbes(probes, CheckType.Browser).filter(
    (probe) => probe.online && !probe.deprecated
  );
  const defaultProbe = availableProbes.find((probe) => probe.public) ?? availableProbes[0];
  useEffect(() => {
    if (probeId === undefined && defaultProbe) {
      setProbeId(defaultProbe.id);
    }
  }, [probeId, defaultProbe]);
  const { preselectUid, isPreselectReady } = useFolderSelection({ enabled: foldersEnabled });
  const { status: folderStatus } = useDefaultFolder(foldersEnabled);
  const selectedFolder = folderChanged ? folderUid : preselectUid;
  const { canWriteChecks } = getUserPermissions();
  const isOverlimit = useIsOverlimit(false, CheckType.Browser);
  const mutation = useCreateCheck();
  const queryClient = useQueryClient();
  const navigateToCheck = useNavigateToCheckDashboard();
  useTrackingScope({ check_template_id: 'broken_links' });
  const selectedProbe = availableProbes.find((probe) => probe.id === probeId);
  const disabled =
    !canWriteChecks || isOverlimit !== false || mutation.isPending || !selectedProbe || !isPreselectReady;

  function parseUrl() {
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  function commitUrl() {
    const parsed = parseUrl();
    if (!parsed) {
      return;
    }
    const next = `Broken links on ${parsed.hostname}`;
    if (!job.trim() || job === suggestedName.current) {
      setJob(next);
    }
    suggestedName.current = next;
  }

  async function createCheck(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current || selectedProbe?.id === undefined) {
      return;
    }
    const parsed = parseUrl();
    const name = jobSchema.safeParse(job.trim() || (parsed ? `Broken links on ${parsed.hostname}` : ''));
    const validStatuses = statuses.split(',').map((status) => Number(status.trim()));
    const nextErrors: Record<string, string> = {};
    if (!parsed) {
      nextErrors.url = 'Enter a valid URL starting with https:// or http://.';
    }
    if (!name.success) {
      nextErrors.job = name.error.issues[0].message;
    }
    if (!Number.isSafeInteger(Number(maxLinks)) || Number(maxLinks) < 1) {
      nextErrors.maxLinks = 'Enter a positive whole number.';
    }
    if (!Number.isFinite(Number(timeout)) || Number(timeout) <= 0 || Number(timeout) > 60) {
      nextErrors.timeout = 'Enter a timeout greater than 0 and at most 60 seconds.';
    }
    if (validStatuses.some((status) => !Number.isInteger(status) || status < 100 || status > 599)) {
      nextErrors.statuses = 'Enter HTTP status codes from 100 to 599, separated by commas.';
    }
    if (foldersEnabled && folderStatus === 'available' && !selectedFolder) {
      nextErrors.folder = 'Choose a folder.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !parsed || !name.success) {
      return;
    }

    submitting.current = true;
    try {
      const check = createBrokenLinksCheck(parsed, name.data, {
        maxLinks: Number(maxLinks),
        timeout: `${Number(timeout)}s`,
        validStatuses,
        failOnBroken,
      });
      const result = await mutation.mutateAsync({
        ...check,
        probes: [selectedProbe.id],
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
      subtitle="Create a check from a template"
      size="sm"
      closeOnMaskClick={!mutation.isPending}
      onClose={() => {
        if (!mutation.isPending) {
          onClose();
        }
      }}
    >
      <form onSubmit={createCheck} noValidate>
        <Stack direction="column" gap={2}>
          <Text>
            Open a page in a browser, collect its links, and check their HTTP responses. Broken links fail the check
            unless you turn that option off.
          </Text>
          <fieldset disabled={mutation.isPending} style={{ border: 0, padding: 0, margin: 0 }}>
            <Field label="Page URL" htmlFor="template-url" error={errors.url} invalid={!!errors.url}>
              <Input
                id="template-url"
                type="url"
                autoFocus
                placeholder="https://grafana.com"
                value={url}
                onBlur={commitUrl}
                onChange={(event) => setUrl(event.currentTarget.value)}
              />
            </Field>
            <Field label="Check name" htmlFor="template-job" error={errors.job} invalid={!!errors.job}>
              <Input id="template-job" value={job} onChange={(event) => setJob(event.currentTarget.value)} />
            </Field>
            <Field
              label="Maximum links"
              htmlFor="template-max-links"
              description="Check up to this many unique links from the page."
              error={errors.maxLinks}
              invalid={!!errors.maxLinks}
            >
              <Input
                id="template-max-links"
                type="number"
                min={1}
                step={1}
                value={maxLinks}
                onChange={(event) => setMaxLinks(event.currentTarget.value)}
              />
            </Field>
            <Field
              label="Timeout per link (seconds)"
              htmlFor="template-timeout"
              error={errors.timeout}
              invalid={!!errors.timeout}
            >
              <Input
                id="template-timeout"
                type="number"
                min={0.1}
                max={60}
                value={timeout}
                onChange={(event) => setLinkTimeout(event.currentTarget.value)}
              />
            </Field>
            <Field
              label="Accepted HTTP status codes"
              htmlFor="template-statuses"
              description="Separate codes with commas."
              error={errors.statuses}
              invalid={!!errors.statuses}
            >
              <Input
                id="template-statuses"
                value={statuses}
                onChange={(event) => setStatuses(event.currentTarget.value)}
              />
            </Field>
            <Field>
              <Checkbox
                label="Fail the check when broken links are found"
                value={failOnBroken}
                onChange={(event) => setFailOnBroken(event.currentTarget.checked)}
              />
            </Field>
            <Field
              label="Probe"
              description="One location is selected by default. This check runs every hour."
              invalid={!probesLoading && !selectedProbe}
              error={
                !probesLoading && !selectedProbe ? 'Select an online probe that supports browser checks.' : undefined
              }
            >
              <Combobox
                aria-label="Probe"
                options={availableProbes.map((probe) => ({ label: probe.displayName || probe.name, value: probe.id! }))}
                value={probeId}
                onChange={(option) => setProbeId(option.value)}
                loading={probesLoading}
                disabled={mutation.isPending}
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
          </fieldset>
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
