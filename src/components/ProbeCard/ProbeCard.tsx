import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Card, Link, LinkButton, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { type ExtendedProbe, FeatureName, type Label, Probe, ProbeWithMetadata } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { isK6VersionUnknown } from 'components/CheckEditor/CheckProbes/CheckProbes.utils';
import { DeprecationNotice } from 'components/DeprecationNotice/DeprecationNotice';
import { FeatureFlag } from 'components/FeatureFlag';
import { ProbeCheckExecutionStats } from 'components/ProbeCheckExecutionStats';

import { ProbeUsageLink } from '../ProbeUsageLink';
import { ProbeDisabledCapabilities } from './ProbeDisabledCapabilities';
import { ProbeLabels } from './ProbeLabels';
import { ProbeMetaPillsRow } from './ProbeMetaPillsRow';
import { ProbeStatus } from './ProbeStatus';

export const ProbeCard = ({ probe }: { probe: ExtendedProbe }) => {
  const { canWriteProbes } = useCanEditProbe(probe);
  const probeEditHref = generateRoutePath(canWriteProbes ? AppRoutes.EditProbe : AppRoutes.ViewProbe, {
    id: probe.id!,
  });
  const labelsString = labelsToString(probe.labels);
  const styles = useStyles2(getStyles2);

  return (
    <Card>
      <Card.Heading>
        <div className={styles.titleRow}>
          <ProbeStatus probe={probe} />
          <Link href={probeEditHref} className={styles.probeTitleLink}>
            <span>{probe.displayName}</span>
            {probe.region && <span>&nbsp;{`(${probe.region})`}</span>}
          </Link>
          {probe.deprecated && (
            <DeprecationNotice
              tooltipContent={
                <div>
                  This probe is deprecated and will be removed soon. For more information{' '}
                  <TextLink
                    variant={'bodySmall'}
                    href="https://grafana.com/docs/grafana-cloud/whats-new/2025-01-14-launch-and-shutdown-dates-for-synthetics-probes-in-february-2025/"
                    external
                  >
                    click here.
                  </TextLink>
                </div>
              }
            />
          )}
        </div>
      </Card.Heading>

      <Card.Description className={styles.bodyDescription}>
        <div className={styles.leftColumn}>
          <FeatureFlag name={FeatureName.VersionManagement}>
            {({ isEnabled }) => (
              <ProbeMetaPillsRow
                version={probe.version}
                k6Pill={isEnabled ? formatK6VersionsInline(probe) : undefined}
                trailing={<ProbeUsageLink probe={probe} className={styles.checksLinkAlign} />}
              />
            )}
          </FeatureFlag>
          {labelsString && (
            <div>
              Labels:{' '}
              <div className={styles.labelContainer}>
                <ProbeLabels labels={probe.labels} />
              </div>
            </div>
          )}
          <ProbeDisabledCapabilities probe={probe} />
        </div>
        <div className={styles.statsColumn}>
          <ProbeCheckExecutionStats probeName={probe.name} />
        </div>
      </Card.Description>

      <Card.Actions>
        {canWriteProbes ? (
          <>
            <LinkButton
              data-testid={DataTestIds.ProbeCardActionButton}
              icon="pen"
              fill="outline"
              variant="secondary"
              href={probeEditHref}
              aria-label={`Edit probe ${probe.displayName}`}
              tooltip="Edit probe"
            >
              Edit
            </LinkButton>
          </>
        ) : (
          <LinkButton
            data-testid={DataTestIds.ProbeCardActionButton}
            href={probeEditHref}
            fill="outline"
            variant="secondary"
            icon="eye"
            tooltip="View probe"
            aria-label={`View probe ${probe.displayName}`}
          >
            View
          </LinkButton>
        )}
      </Card.Actions>
    </Card>
  );
};

export function formatK6VersionsInline(probe: ProbeWithMetadata | Probe) {
  if (!probe.k6Versions || Object.keys(probe.k6Versions).length === 0) {
    return 'unknown';
  }
  const unique = [
    ...new Set(
      Object.values(probe.k6Versions)
        .filter((v): v is string => v !== null)
        .map((v) => (isK6VersionUnknown(v) ? 'unknown' : `v${v}`))
    ),
  ];
  return unique.join(', ') || 'unknown';
}

const getStyles2 = (theme: GrafanaTheme2) => {
  const containerName = `probeCard`;

  return {
    card: css({
      containerName,
    }),
    titleRow: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5),
      minWidth: 0,
      width: '100%',
    }),
    probeTitleLink: css({
      minWidth: 0,
    }),
    checksLinkAlign: css({
      flexShrink: 0,
    }),
    bodyDescription: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'flex-start',
      gap: theme.spacing(2),
      width: '100%',
      [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
        gridTemplateColumns: '1fr',
      },
    }),
    leftColumn: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      minWidth: 0,
    }),
    statsColumn: css({
      display: 'flex',
      justifyContent: 'flex-end',
      [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
        justifyContent: 'flex-start',
        paddingTop: theme.spacing(1),
        borderTop: `1px solid ${theme.colors.border.medium}`,
        width: '100%',
      },
    }),
    badgeContainer: css({
      display: `inline-flex`,
      gap: theme.spacing(0.5),
      flexWrap: `wrap`,
    }),
    extendedTags: css({
      gridRowEnd: 'span 2',
    }),
    labelContainer: css({
      display: 'inline-flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5),
    }),
  };
};

function labelsToString(labels: Label[]) {
  return labels.map(({ name, value }) => `label_${name}: ${value}`).join(', ');
}
