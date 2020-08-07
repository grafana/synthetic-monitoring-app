import React, { FC, useState } from 'react';
import { css } from 'emotion';
import { Badge, BadgeColor, Button, Container, ConfirmModal, Legend, IconName } from '@grafana/ui';
import { Probe, OrgRole } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { UptimeGauge } from './UptimeGauge';

interface Props {
  probe: Probe;
  instance: SMDataSource;
  onResetToken: () => void;
}

interface BadgeStatus {
  color: BadgeColor;
  text: string;
  icon: IconName;
}

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

const ProbeStatus: FC<Props> = ({ probe, instance, onResetToken }) => {
  const [showResetModal, setShowResetModal] = useState(false);

  if (!probe) {
    return null;
  }
  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);
  const badgeStatus = getBadgeStatus(probe.online);

  const handleResetToken = () => {
    onResetToken();
    setShowResetModal(false);
  };

  return (
    <Container margin="md">
      <div
        className={css`
          padding-left: 0.75rem;
          margin-bottom: 1.5rem;
        `}
      >
        <div
          className={css`
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
          `}
        >
          <Legend
            className={css`
              margin: 6px 0.5rem 0 0;
              width: auto;
            `}
          >
            Status:
          </Legend>
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
      <UptimeGauge
        labelNames={['probe']}
        labelValues={[probe.name]}
        ds={instance.getMetricsDS()}
        height={200}
        width={300}
        sparkline={true}
      />
    </Container>
  );
};

export default ProbeStatus;
