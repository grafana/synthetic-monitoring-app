import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { useAppInitializer } from 'hooks/useAppInitializer';
import { useMeta } from 'hooks/useMeta';
import { MismatchedDatasourceModal } from 'components/MismatchedDatasourceModal';

interface Props {
  redirectTo?: ROUTES;
  disabled: boolean;
  buttonClassname?: string;
  buttonText: string;
}

export const AppInitializer = ({ redirectTo, disabled, buttonClassname, buttonText }: PropsWithChildren<Props>) => {
  const { jsonData } = useMeta();
  const styles = useStyles2(getStyles);

  const {
    error,
    setError,
    loading,
    metricsByName,
    metricsByUid,
    logsByName,
    logsByUid,
    initialize,
    handleClick,
    datasourceModalOpen,
    setDataSouceModalOpen,
  } = useAppInitializer(redirectTo);

  return (
    <div>
      <Button onClick={handleClick} disabled={loading || disabled} size="lg" className={buttonClassname}>
        {loading ? <Spinner /> : buttonText}
      </Button>

      {error && (
        <Alert title="Something went wrong:" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      <MismatchedDatasourceModal
        isOpen={datasourceModalOpen}
        metricsFoundName={metricsByName?.name ?? 'Not found'}
        metricsExpectedName={metricsByUid?.name ?? 'Not found'}
        logsFoundName={logsByName?.name ?? 'Not found'}
        logsExpectedName={logsByUid?.name ?? 'Not found'}
        onDismiss={() => setDataSouceModalOpen(false)}
        isSubmitting={loading}
        onSubmit={() => {
          if (jsonData.metrics?.hostedId && jsonData.logs.hostedId) {
            initialize({
              metricsSettings: metricsByUid!, // we have already guaranteed that this exists above
              metricsHostedId: jsonData.metrics.hostedId,
              logsSettings: logsByUid!, // we have already guaranteed that this exists above
              logsHostedId: jsonData.logs.hostedId,
            });
          } else {
            setError('Missing datasource hostedId');
          }
        }}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorAlert: css({
    marginTop: theme.spacing(4),
  }),
});
