import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Badge, BadgeColor, Button, Container, ConfirmModal, Legend, IconName, useStyles2 } from '@grafana/ui';
import { Probe } from 'types';
import { hasRole } from 'utils';
import { SuccessRateGauge } from './SuccessRateGauge';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { REACHABILITY_DESCRIPTION } from './constants';

interface Props {
  probe: Probe;
  onResetToken: () => void;
}

interface BadgeStatus {
  color: BadgeColor;
  text: string;
  icon: IconName;
}

const getStyles = (theme: GrafanaTheme2) => ({
  legend: css`
    margin: 0 ${theme.spacing(1)} 0 0;
    font-size: 33px;
    width: auto;
  `,
  container: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  badgeContainer: css`
    margin-bottom: ${theme.spacing(3)};
    display: flex;
    align-items: center;
  `,
});

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

const ProbeStatus = ({ probe, onResetToken }: Props) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const styles = useStyles2(getStyles);

  if (!probe) {
    return null;
  }
  const isEditor = !probe.public && hasRole(OrgRole.Editor);
  const badgeStatus = getBadgeStatus(probe.online);

  const handleResetToken = () => {
    onResetToken();
    setShowResetModal(false);
  };

  return (
    <Container margin="md">
      <div className={styles.container}>
        <div className={styles.badgeContainer}>
          <Legend className={styles.legend}>Status:</Legend>
          <Badge color={badgeStatus.color} icon={badgeStatus.icon} text={badgeStatus.text} />
        </div>
        {!probe.public && (
          <Container>
            <Button variant="destructive" onClick={() => setShowResetModal(true)} disabled={!isEditor}>
              Reset Access Token
            </Button>
            <ConfirmModal
              isOpen={showResetModal}
              title="Reset Probe Access Token"
              body="Are you sure you want to reset the access token for this Probe?"
              confirmText="Reset Token"
              onConfirm={handleResetToken}
              onDismiss={() => setShowResetModal(false)}
            />
          </Container>
        )}
      </div>
      <SuccessRateGauge
        title="Reachability"
        id={probe.id!}
        type={SuccessRateTypes.Probes}
        infoText={REACHABILITY_DESCRIPTION}
        height={200}
        width={300}
      />
    </Container>
  );
};

export default ProbeStatus;
