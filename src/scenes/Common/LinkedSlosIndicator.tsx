import React from 'react';
import { config } from '@grafana/runtime';
import { Link, Stack, Text } from '@grafana/ui';

import { Check } from 'types';

import { useSmCheckSlos } from './useSmCheckSlos';

type LinkedSlosIndicatorProps = {
  check: Check;
};

const SLO_APP_RELATIVE_PATH = '/a/grafana-slo-app';

export function LinkedSlosIndicator({ check }: LinkedSlosIndicatorProps) {
  const { slos, isLoading } = useSmCheckSlos(check.id, check.job);

  if (isLoading || slos.length === 0) {
    return null;
  }

  const href = `${config.appSubUrl}${SLO_APP_RELATIVE_PATH}`;
  const label = slos.length === 1 ? '1 linked SLO' : `${slos.length} linked SLOs`;

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      <Text variant="bodySmall" color="secondary">
        <Link href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </Link>
      </Text>
    </Stack>
  );
}
