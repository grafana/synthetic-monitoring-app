import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { APP_INITIALIZER_TEST_ID } from 'test/dataTestIds';

import { FaroEvent, reportEvent } from 'faro';
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
  // When true, initialization is triggered automatically on mount (no click)
  // and the current page is reloaded on success so the user stays on their
  // intended deep-link. Used by the auto-enable-on-URL flow.
  autoStart?: boolean;
}

// TODO: Does this really belong under /page?
export const AppInitializer = ({ redirectTo, buttonText, autoStart = false }: PropsWithChildren<Props>) => {
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
  } = useAppInitializer(redirectTo, autoStart);

  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && canReadDs && canInitialize) {
      hasAutoStarted.current = true;
      reportEvent(FaroEvent.AutoInit);
      handleClick();
    }
  }, [autoStart, canReadDs, canInitialize, handleClick]);

  if (!canReadDs) {
    return <ContactAdminAlert missingPermissions={['datasources:read']} />;
  }

  if (!canInitialize) {
    return (
      <ContactAdminAlert missingPermissions={['grafana-synthetic-monitoring-app.plugin:write', 'datasources:create']} />
    );
  }

  return (
    <div data-testid={APP_INITIALIZER_TEST_ID.root}>
      {autoStart ? (
        // Auto-initializing: show a spinner instead of the manual button. If
        // something goes wrong, the error alert / mismatch modal below take over.
        !error && (
          <div data-testid={APP_INITIALIZER_TEST_ID.autoInitSpinner}>
            <Spinner size="xl" />
          </div>
        )
      ) : (
        <Button data-testid={APP_INITIALIZER_TEST_ID.initButton} onClick={handleClick} disabled={loading} size="lg">
          {loading ? <Spinner /> : buttonText}
        </Button>
      )}

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
