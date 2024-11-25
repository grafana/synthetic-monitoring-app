import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Card, Link, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type ExtendedProbe, type Label, ROUTES } from 'types';
import { generateRoutePath } from 'routing/utils';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { SuccessRateGaugeProbe } from 'components/Gauges';

import { ProbeUsageLink } from '../ProbeUsageLink';
import { ProbeDisabledCapabilities } from './ProbeDisabledCapabilities';
import { ProbeLabels } from './ProbeLabels';
import { ProbeStatus } from './ProbeStatus';

export const ProbeCard = ({ probe }: { probe: ExtendedProbe }) => {
  const canEdit = useCanEditProbe(probe);
  const probeEditHref = generateRoutePath(canEdit ? ROUTES.EditProbe : ROUTES.ViewProbe, { id: probe.id! });
  const labelsString = labelsToString(probe.labels);
  const styles = useStyles2(getStyles2);

  return (
    <Card>
      <Card.Heading>
        <div>
          <ProbeStatus probe={probe} />
          <Link href={probeEditHref}>
            <span>{probe.name}</span>
            {probe.region && <span>&nbsp;{`(${probe.region})`}</span>}
          </Link>
        </div>
      </Card.Heading>

      <Card.Meta>
        <div>Version: {probe.version}</div>
      </Card.Meta>

      <Card.Description className={styles.extendedDescription}>
        <div>
          {labelsString && (
            <div>
              Labels:{' '}
              <div className={styles.labelContainer}>
                <ProbeLabels labels={probe.labels} />
              </div>
            </div>
          )}
          <ProbeDisabledCapabilities probe={probe} />
          <ProbeUsageLink probe={probe} />
        </div>
        <div className={styles.gaugeContainer}>
          <SuccessRateGaugeProbe probeName={probe.name} height={60} width={150} />
        </div>
      </Card.Description>

      <Card.Actions>
        {canEdit ? (
          <>
            <LinkButton
              data-testid="probe-card-action-button"
              icon="pen"
              fill="outline"
              variant="secondary"
              href={probeEditHref}
              aria-label={`Edit probe ${probe.name}`}
              tooltip="Edit probe"
            >
              Edit
            </LinkButton>
          </>
        ) : (
          <LinkButton
            data-testid="probe-card-action-button"
            href={probeEditHref}
            fill="outline"
            variant="secondary"
            icon="eye"
            tooltip="View probe"
            aria-label={`View probe ${probe.name}`}
          >
            View
          </LinkButton>
        )}
      </Card.Actions>
    </Card>
  );
};

const getStyles2 = (theme: GrafanaTheme2) => {
  const containerName = `probeCard`;

  return {
    card: css({
      containerName,
    }),
    badgeContainer: css({
      display: `inline-flex`,
      gap: theme.spacing(0.5),
      flexWrap: `wrap`,
    }),
    gaugeContainer: css({
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gridArea: `gauge`,
    }),
    extendedTags: css({
      gridRowEnd: 'span 2',
    }),
    extendedDescription: css({
      gridColumn: '1 / span 3',
      display: 'flex',
      justifyContent: 'space-between',
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
