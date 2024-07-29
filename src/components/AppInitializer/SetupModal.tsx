import React, { useCallback } from 'react';
import { Modal, Spinner } from '@grafana/ui';

import { ROUTES } from 'types';
import { useMeta } from 'hooks/useMeta';
import { AppSetupForm } from 'components/AppInitializer/SetupForm';
import { useCheckProvisioning } from 'components/AppInitializer/useCheckProvisioning';
import { getRoute } from 'components/Routing.utils';

interface SetupModalProps {
  onDismiss: () => void;
  redirectTo?: ROUTES;
}

export const SetupModal = ({ onDismiss, redirectTo }: SetupModalProps) => {
  const { jsonData } = useMeta();
  const { logs, metrics } = jsonData;
  const { isPending: logsPending, data: logsUid, error: logsError } = useCheckProvisioning(logs, `loki`);
  const {
    isPending: metricsPending,
    data: metricsUid,
    error: metricsError,
  } = useCheckProvisioning(metrics, `prometheus`);

  const isPending = logsPending || metricsPending;

  const handleSuccess = useCallback(() => {
    const newLocation = redirectTo ? getRoute(redirectTo) : getRoute(ROUTES.Home);
    window.location.href = `${window.location.origin}${newLocation}`;
  }, [redirectTo]);

  return (
    <Modal isOpen title={`Set up Synthetic Monitoring`} onDismiss={onDismiss}>
      {isPending ? (
        <Spinner />
      ) : (
        <AppSetupForm
          logsUid={logsUid}
          logsError={logsError}
          metricsError={metricsError}
          metricsUid={metricsUid}
          onSuccess={handleSuccess}
        />
      )}
    </Modal>
  );
};
