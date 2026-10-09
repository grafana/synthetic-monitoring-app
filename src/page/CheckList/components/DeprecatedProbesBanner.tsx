import React from 'react';
import { Alert, Stack, TextLink } from '@grafana/ui';

import { Check } from 'types';
import { CheckPermissions } from 'data/folderPermissions';
import { useProbesWithMetadata } from 'data/useProbes';
import { getChecksListHref } from 'components/ProbeUsageLink';

export function DeprecatedProbesBanner({
  checks,
  getPermissions,
}: {
  checks: Check[];
  getPermissions: (check: Check) => CheckPermissions;
}) {
  const { data: probes = [] } = useProbesWithMetadata();
  const affectedProbes = probes.filter(
    (probe) => probe.deprecated && checks.some((check) => check.probes.includes(probe.id!))
  );
  const affectedChecks = checks.filter((check) => affectedProbes.some((probe) => check.probes.includes(probe.id!)));

  if (affectedChecks.length === 0) {
    return null;
  }

  return (
    <Alert severity="warning" title="Move your checks off deprecated probes">
      <Stack direction="column" gap={1} alignItems="flex-start">
        <div>
          {affectedChecks.length} {affectedChecks.length === 1 ? 'check uses' : 'checks use'} deprecated probes. Choose
          replacement locations and remove the deprecated probes. They can no longer be added to checks.
        </div>
        {affectedChecks.some((check) => !getPermissions(check).canWrite) && (
          <div>You need edit access to update checks. Ask someone with edit access to help where needed.</div>
        )}
        {affectedProbes.map((probe) => (
          <TextLink key={probe.id} href={getChecksListHref(probe.displayName)}>
            Review checks using {probe.displayName}
          </TextLink>
        ))}
      </Stack>
    </Alert>
  );
}
