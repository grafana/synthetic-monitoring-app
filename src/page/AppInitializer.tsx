import React, { PropsWithChildren, useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { useAppInitializer } from 'hooks/useAppInitializer';
// import { useNavigation } from 'hooks/useNavigation';

interface Props {
  redirectTo?: ROUTES;
  buttonClassname?: string;
  buttonText: string;
}

export const AppInitializer = ({ redirectTo, buttonClassname, buttonText }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles);
  // const navigate = useNavigation();
  const { initialize, loading, error, disabled } = useAppInitializer();
  const ds = getDataSourceSrv().getList();
  console.log(ds);

  const handleClick = useCallback(async () => {
    await initialize();

    if (redirectTo) {
      console.log(`redirectTo: ${redirectTo}`);
      // navigate(redirectTo);
    }
  }, [initialize, redirectTo]);

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
          {error?.message}
        </Alert>
      )}

      {/* todo: is this needed? */}
      {/* <MismatchedDatasourceModal
        isOpen={datasourceModalOpen}
        onDismiss={() => setDataSouceModalOpen(false)}
        disabled={loading}
        loading={loading}
        onSubmit={() => {
          console.log(`onSubmit`);
        }}
      /> */}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorAlert: css({
    marginTop: theme.spacing(4),
    textAlign: `initial`,
  }),
});
