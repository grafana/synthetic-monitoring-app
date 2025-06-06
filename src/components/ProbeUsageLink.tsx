import React from 'react';
import { ThemeTypographyVariantTypes } from '@grafana/data';
import { TextLink } from '@grafana/ui';

import { ExtendedProbe } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { DataTestIds } from '../test/dataTestIds';
interface ProbeUsageLinkProps {
  probe: ExtendedProbe;
  variant?: keyof Omit<ThemeTypographyVariantTypes, 'code'>;
  showWhenUnused?: boolean;
  className?: string;
}

export function ProbeUsageLink({ probe, className, variant, showWhenUnused = false }: ProbeUsageLinkProps) {
  const hasChecks = probe.checks.length > 0;
  const checksCount = hasChecks && probe.checks.length > 0 ? probe.checks.length : 0;
  const checksHref = `${getRoute(AppRoutes.Checks)}?probes=${probe.name}`;
  const noun = hasChecks && checksCount > 1 ? 'checks' : 'check';

  if (!hasChecks && !showWhenUnused) {
    return null;
  }

  return (
    <TextLink
      data-testid={DataTestIds.PROBE_USAGE_LINK}
      className={className}
      variant={variant}
      color="link"
      href={checksHref}
    >
      {`Used in ${checksCount} ${noun}`}
    </TextLink>
  );
}
