import React from 'react';
import { dateTimeFormatTimeAgo, GrafanaTheme2 } from '@grafana/data';
import { Icon, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ProbeWithMetadata } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

interface ProbeHealthSectionProps {
  probes: ProbeWithMetadata[];
  offlineProbes: ProbeWithMetadata[];
  isLoading: boolean;
}

export const ProbeHealthSection = ({ probes, offlineProbes, isLoading }: ProbeHealthSectionProps) => {
  const styles = useStyles2(getStyles);

  if (isLoading || probes.length === 0) {
    return null;
  }

  if (offlineProbes.length === 0) {
    return (
      <div className={styles.allOnline} data-testid="probe-health-section">
        <Icon name="heart" className={styles.onlineIcon} />
        <Text color="secondary">
          All {probes.length} <TextLink href={getRoute(AppRoutes.Probes)}>probes</TextLink> are online
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="probe-health-section">
      {offlineProbes.map((probe) => (
        <div key={probe.id} className={styles.row}>
          <Icon name="heart-break" className={styles.offlineIcon} />
          <TextLink href={generateRoutePath(AppRoutes.ViewProbe, { id: probe.id! })} inline={false}>
            {probe.displayName}
          </TextLink>
          <Text color="secondary">{probe.region}</Text>
          <Text color="secondary">offline since {dateTimeFormatTimeAgo(probe.onlineChange * 1000)}</Text>
        </div>
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 2),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  allOnline: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
  }),
  onlineIcon: css({
    color: theme.colors.success.text,
  }),
  offlineIcon: css({
    color: theme.colors.error.text,
  }),
});
