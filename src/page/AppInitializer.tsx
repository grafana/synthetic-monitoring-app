import React, { PropsWithChildren, useContext } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useAppInitializer } from 'hooks/useAppInitializer';
import { MismatchedDatasourceModal } from 'components/MismatchedDatasourceModal';

interface Props {
  redirectTo?: ROUTES;
  disabled: boolean;
  buttonClassname?: string;
  buttonText: string;
}

export const AppInitializer = ({ redirectTo, disabled, buttonClassname, buttonText }: PropsWithChildren<Props>) => {
  const { meta } = useContext(InstanceContext);

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
    <Stack direction={`column`} alignItems={`center`}>
      <Button
        onClick={handleClick}
        disabled={loading || disabled}
        size="lg"
        className={buttonClassname}
        icon={loading ? 'fa fa-spinner' : undefined}
      >
        {buttonText}
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
          if (meta?.jsonData?.metrics?.hostedId && meta?.jsonData?.logs.hostedId) {
            initialize({
              metricsSettings: metricsByUid!, // we have already guaranteed that this exists above
              metricsHostedId: meta.jsonData.metrics.hostedId,
              logsSettings: logsByUid!, // we have already guaranteed that this exists above
              logsHostedId: meta.jsonData.logs.hostedId,
            });
          } else {
            setError('Missing datasource hostedId');
          }
        }}
      />
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorAlert: css({
    marginTop: theme.spacing(4),
    textAlign: `initial`,
  }),
});
