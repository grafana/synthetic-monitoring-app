import React from 'react';
import { ThemeTypographyVariantTypes } from '@grafana/data';
import { LinkButton, TextLink } from '@grafana/ui';

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

function getChecksListHref(probeName: string) {
  const path = getRoute(AppRoutes.Checks);
  const params = new URLSearchParams({ probes: probeName });
  return `${path}?${params.toString()}`;
}

function getChecksLinkCopy(checksCount: number) {
  if (checksCount === 0) {
    return 'No checks use this probe';
  }

  if (checksCount === 1) {
    return 'View 1 check';
  }

  return `View ${checksCount} checks`;
}

export function ProbeUsageLink({ probe, className, variant, showWhenUnused = false }: ProbeUsageLinkProps) {
  const hasChecks = probe.checks.length > 0;
  const checksCount = hasChecks ? probe.checks.length : 0;
  const checksHref = getChecksListHref(probe.name);
  const linkText = getChecksLinkCopy(checksCount);

  if (!hasChecks && !showWhenUnused) {
    return null;
  }

  if (!hasChecks && showWhenUnused) {
    return (
      <span className={className} data-testid={DataTestIds.ProbeUsageLink}>
        {linkText}
      </span>
    );
  }

  if (variant === 'bodySmall') {
    return (
      <TextLink
        data-testid={DataTestIds.ProbeUsageLink}
        className={className}
        variant={variant}
        color="link"
        href={checksHref}
      >
        {linkText}
      </TextLink>
    );
  }

  return (
    <LinkButton
      data-testid={DataTestIds.ProbeUsageLink}
      className={className}
      href={checksHref}
      icon="list-ul"
      size="sm"
      variant="secondary"
      fill="outline"
    >
      {linkText}
    </LinkButton>
  );
}
