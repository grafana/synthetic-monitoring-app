import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Badge,
  BadgeColor,
  Button,
  ConfirmModal,
  Container,
  IconName,
  Legend,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { type ExtendedProbe } from 'types';
import { formatDate } from 'utils';
import { useResetProbeToken } from 'data/useProbes';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { DeprecationNotice } from 'components/DeprecationNotice/DeprecationNotice';
import { SuccessRateGaugeProbe } from 'components/Gauges';

import { ProbeUsageLink } from '../ProbeUsageLink';

interface ProbeStatusProps {
  probe: ExtendedProbe;
  onReset: (token: string) => void;
  readOnly?: boolean;
}

interface BadgeStatus {
  color: BadgeColor;
  text: string;
  icon: IconName;
}

export const ProbeStatus = ({ probe, onReset, readOnly }: ProbeStatusProps) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const { canWriteProbes } = useCanEditProbe(probe);
  const writeMode = canWriteProbes && !readOnly;

  const styles = useStyles2(getStyles);
  const { mutate: onResetToken } = useResetProbeToken({
    onSuccess: ({ token }) => {
      setShowResetModal(false);
      onReset(token);
    },
  });

  if (!probe) {
    return null;
  }

  const badgeStatus = getBadgeStatus(probe.online);
  const neverModified = probe.created === probe.modified;
  const neverOnline = probe.onlineChange === probe.created && !probe.online;

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.badgeContainer}>
          <Legend className={styles.legend}>Status:</Legend>
          <Badge color={badgeStatus.color} icon={badgeStatus.icon} text={badgeStatus.text} />
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
        {canWriteProbes && (
          <Container>
            <Button variant="destructive" disabled={!writeMode} onClick={() => setShowResetModal(true)}>
              Reset Access Token
            </Button>
            <ConfirmModal
              isOpen={showResetModal}
              title="Reset Probe Access Token"
              body="Are you sure you want to reset the access token for this Probe?"
              confirmText="Reset Token"
              onConfirm={() => onResetToken(probe)}
              onDismiss={() => setShowResetModal(false)}
            />
          </Container>
        )}
      </div>
      <SuccessRateGaugeProbe probeName={probe.name} height={200} width={300} />
      <div className={styles.metaWrapper}>
        <Meta title="Version:" value={probe.version} />
        <Meta
          title={`Last ${probe.online ? `offline` : `online`}:`}
          value={neverOnline ? `Never` : formatDate(probe.onlineChange * 1000)}
        />
        {probe.modified && (
          <Meta title="Last modified:" value={neverModified ? `Never` : formatDate(probe.modified * 1000)} />
        )}
        <ProbeUsageLink probe={probe} />
      </div>
    </div>
  );
};

const Meta = ({ title, value }: { title: string; value: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.metaItem}>
      <div className={css({ fontWeight: 700 })}>{title}</div>
      <div>{value}</div>
    </div>
  );
};

const getBadgeStatus = (online: boolean): BadgeStatus => {
  if (online) {
    return {
      text: 'Online',
      color: 'green',
      icon: 'heart',
    };
  }
  return {
    text: 'Offline',
    color: 'red',
    icon: 'heart-break',
  };
};

const getStyles = (theme: GrafanaTheme2) => ({
  legend: css({
    margin: theme.spacing(0, 1, 0, 0),
    width: `auto`,
  }),
  container: css({
    paddingLeft: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }),
  badgeContainer: css({
    marginBottom: theme.spacing(1),
    display: `flex`,
    alignItems: `center`,
  }),
  metaWrapper: css({
    display: `flex`,
    gap: theme.spacing(1),
    flexDirection: `column`,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(1),
  }),
  metaItem: css({ display: `flex`, gap: theme.spacing(0.5) }),
});
