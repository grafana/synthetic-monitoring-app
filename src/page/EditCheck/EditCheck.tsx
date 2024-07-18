import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, LinkButton, Modal } from '@grafana/ui';

import { CheckPageParams, ROUTES } from 'types';
import { useChecks } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { getRoute } from 'components/Routing.utils';

export const EditCheck = () => {
  return <EditCheckContent />;
};

const EditCheckContent = () => {
  const { id } = useParams<CheckPageParams>();
  const { data: checks, isError, isLoading, error, refetch } = useChecks();
  const check = checks?.find((c) => c.id === Number(id));
  const job = check?.job || ``;
  const pageTitle = isLoading ? `Loading...` : `Editing ${job}`;

  return (
    <>
      <CheckForm
        check={check}
        disabled={isLoading || isError}
        pageTitle={pageTitle}
        key={check ? `loading` : `ready`}
      />
      {checks && !check && <NotFoundModal />}
      {error && <ErrorModal error={error} onClick={refetch} />}
    </>
  );
};

const NotFoundModal = () => {
  const navigate = useNavigation();

  const handleOnDismiss = useCallback(() => {
    navigate(ROUTES.Checks);
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
        <LinkButton href={getRoute(ROUTES.Checks)}>Go to check list</LinkButton>
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
        <LinkButton href={getRoute(ROUTES.Checks)}>Go to check list</LinkButton>
        <Button onClick={onClick}>Retry</Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
