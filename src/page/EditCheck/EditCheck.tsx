import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, LinkButton, Modal, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckPageParams } from 'types';
import { createNavModel } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { CheckFormContextProvider, useCheckFormMetaContext } from 'components/CheckForm/CheckFormContext';

export const EditCheck = () => {
  const { id } = useParams<CheckPageParams>();
  const { data: checks, isError, isLoading, error, refetch, isFetched } = useChecks();
  const check = checks?.find((c) => c.id === Number(id));

  // Only show spinner for the initial fetch.
  if (isLoading && !isFetched) {
    return <CenteredSpinner />;
  }

  return (
    <CheckFormContextProvider check={check} disabled={isLoading || isError}>
      <EditCheckContent isLoading={isLoading} />
      {checks && !check && <NotFoundModal />}
      {error && <ErrorModal error={error} onClick={refetch} />}
    </CheckFormContextProvider>
  );
};

const EditCheckContent = ({ isLoading = false }: { isLoading: boolean }) => {
  const { check, getIsExistingCheck, isLoading: isLoadingMeta } = useCheckFormMetaContext();

  const isExistingCheck = getIsExistingCheck(check);

  const isReady = !isLoading && !isLoadingMeta;

  const styles = useStyles2(getStyles);

  const navModel = useMemo(() => {
    return createNavModel(
      {
        text: check?.job ?? 'unknown',
        url: check?.id ? generateRoutePath(AppRoutes.CheckDashboard, { id: check.id }) : '',
      },
      [{ text: `Edit` }]
    );
  }, [check]);

  return (
    <PluginPage
      pageNav={navModel}
      renderTitle={isExistingCheck ? () => <Text element="h1">{`Editing ${check.job}`}</Text> : undefined}
    >
      <div className={styles.wrapper} data-testid={isReady ? DataTestIds.PAGE_READY : DataTestIds.PAGE_NOT_READY}>
        <CheckForm key={check ? `loading` : `ready`} />
      </div>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});

const NotFoundModal = () => {
  const navigate = useNavigation();

  const handleOnDismiss = useCallback(() => {
    navigate(AppRoutes.Checks);
  }, [navigate]);

  return (
    <Modal
      title={`Check not found`}
      isOpen
      onDismiss={handleOnDismiss}
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <Alert title={``} severity="error">
        We were unable to find your check. It may have been deleted or you may not have access to it. If you think you
        are seeing this message in error, please contact your administrator.
      </Alert>
      <Modal.ButtonRow>
        <LinkButton href={getRoute(AppRoutes.Checks)}>Go to check list</LinkButton>
      </Modal.ButtonRow>
    </Modal>
  );
};

const ErrorModal = ({ error, onClick }: { error: Error; onClick: () => void }) => {
  return (
    <Modal title={`Error`} isOpen onDismiss={onClick} closeOnBackdropClick={false} closeOnEscape={false}>
      <Alert title={error.message} severity="error">
        <div>
          An error has occurred, this can be caused by either poor connectivity or an error with our servers. If you
          have an ad blocking extension installed in your browser, try disabling it and reload the page.
        </div>
      </Alert>
      <Modal.ButtonRow>
        <LinkButton href={getRoute(AppRoutes.Checks)}>Go to check list</LinkButton>
        <Button onClick={onClick}>Retry</Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
