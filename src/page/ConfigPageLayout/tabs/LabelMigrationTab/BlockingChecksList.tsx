import React from 'react';
import { Stack, Text, TextLink } from '@grafana/ui';

import { type Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

function getChecksListHref(label: string) {
  const params = new URLSearchParams({ search: label });
  return `${getRoute(AppRoutes.Checks)}?${params.toString()}`;
}

// BlockingChecksList shows which checks currently carry a given label, so an
// admin can jump straight to them instead of guessing from the label name
// alone. A label with zero matches most likely lives on a probe, which this
// list can't see (probe labels aren't tied to any Check object).
export function BlockingChecksList({ label, checks }: { label: string; checks: Check[] }) {
  const blockingChecks = checks.filter((check) => check.labels.some((l) => l.name === label));

  if (blockingChecks.length === 0) {
    return (
      <Text color="secondary" variant="bodySmall" data-testid={`blocking-checks-empty-${label}`}>
        No checks currently carry this label — it may be set on a probe, which must be edited directly.
      </Text>
    );
  }

  return (
    <Stack direction="row" gap={1} wrap="wrap" alignItems="center" data-testid={`blocking-checks-${label}`}>
      <Text color="secondary" variant="bodySmall">
        Blocking checks:
      </Text>
      {blockingChecks.map((check, i) => (
        <React.Fragment key={check.id}>
          <TextLink variant="bodySmall" href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}>
            {check.job}
          </TextLink>
          {i < blockingChecks.length - 1 && <Text color="secondary">,</Text>}
        </React.Fragment>
      ))}
      <TextLink variant="bodySmall" href={getChecksListHref(label)} data-testid={`blocking-checks-view-all-${label}`}>
        View all {blockingChecks.length} in Checks list
      </TextLink>
    </Stack>
  );
}
