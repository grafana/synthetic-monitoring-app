import { Alert } from '@grafana/ui';
import { useNavigation } from 'hooks/useNavigation';
import React from 'react';
import { ROUTES } from 'types';

const EmptyCheckList = () => {
  const navigate = useNavigation();

  return (
    <Alert
      severity="info"
      title="Grafana Cloud Synthetic Monitoring"
      buttonContent={<span>New Check</span>}
      onRemove={(event: React.MouseEvent) => navigate(ROUTES.ChooseCheckType)}
    >
      This account does not currently have any checks configured. Click the New Check button to start monitoring your
      services with Grafana Cloud, or{' '}
      <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
        check out the Synthetic Monitoring docs.
      </a>
    </Alert>
  );
};

export default EmptyCheckList;
