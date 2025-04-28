import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { hasGlobalPermission } from 'utils';
import { AppRoutes } from 'routing/types';
import { getUserPermissions } from 'data/permissions';
import { useAppInitializer } from 'hooks/useAppInitializer';
import { useMeta } from 'hooks/useMeta';
import { MismatchedDatasourceModal } from 'components/MismatchedDatasourceModal';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

interface Props {
  redirectTo?: AppRoutes;
  buttonText: string;
}

// TODO: Does this really belong under /page?
export const AppInitializer = ({ redirectTo, buttonText }: PropsWithChildren<Props>) => {
  const { jsonData } = useMeta();
  const styles = useStyles2(getStyles);
  const { canWritePlugin } = getUserPermissions();

  const canReadDs = hasGlobalPermission(`datasources:read`);
  const canInitialize = canWritePlugin && hasGlobalPermission(`datasources:create`);

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

  if (!canReadDs) {
    return <ContactAdminAlert missingPermissions={['datasources:read']} />;
  }

  if (!canInitialize) {
    return (
      <ContactAdminAlert missingPermissions={['grafana-synthetic-monitoring-app.plugin:write', 'datasources:create']} />
    );
  }

  return (
    <div data-testid={DataTestIds.APP_INITIALIZER}>
      <Button onClick={handleClick} disabled={loading} size="lg">
        {loading ? <Spinner /> : buttonText}
      </Button>

      {error && (
        <Alert title="Something went wrong:" className={styles.alert}>
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
          if (jsonData.metrics.hostedId && jsonData.logs.hostedId) {
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
  alert: css({
    marginTop: theme.spacing(4),
  }),
});
