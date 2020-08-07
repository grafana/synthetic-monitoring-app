import React, { FC, useState } from 'react';
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

const ProbeStatus: FC<Props> = ({ probe, instance, onResetToken }) => {
  const [showResetModal, setShowResetModal] = useState(false);

  if (!probe) {
    return null;
  }
  let isEditor = !probe.public && hasRole(OrgRole.EDITOR);
  let onlineTxt = 'Offline';
  let onlineIcon = 'heart-break' as IconName;
  let color = 'red' as BadgeColor;
  if (probe.online) {
    onlineTxt = 'Online';
    onlineIcon = 'heart';
    color = 'green';
  }

  const handleResetToken = () => {
    onResetToken();
    setShowResetModal(false);
  };

  return (
    <Container margin="md">
      <Legend>
        Status: &nbsp;
        <Badge color={color} icon={onlineIcon} text={onlineTxt} />
      </Legend>
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
            onConfirm={() => handleResetToken()}
            onDismiss={() => setShowResetModal(false)}
          />
        </Container>
      )}
      <br />
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
