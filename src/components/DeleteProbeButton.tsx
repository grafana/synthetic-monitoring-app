import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { FetchResponse } from '@grafana/runtime';
import { Button, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import { type ExtendedProbe } from 'types';

import { useDeleteProbe } from '../data/useProbes';
import { useCanEditProbe } from '../hooks/useCanEditProbe';
import { ConfirmModal } from './ConfirmModal';
import { ProbeUsageLink } from './ProbeUsageLink';

type BackendError = FetchResponse<{ err: string; msg: string }>;

interface DeleteProbeButtonProps {
  probe: ExtendedProbe;
}

export function DeleteProbeButton({ probe }: DeleteProbeButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const onDeleteSuccess = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const { mutateAsync: deleteProbe, isPending } = useDeleteProbe({ onSuccess: onDeleteSuccess });
  const canEdit = useCanEditProbe(probe);
  const canDelete = canEdit && !probe.checks.length;
  const styles = getStyles();
  const [error, setError] = useState<undefined | { name: string; message: string }>();

  const handleError = (error: Error | BackendError) => {
    if (!error) {
      setError(undefined);
    }

    if ('data' in error && 'err' in error.data && 'msg' in error.data) {
      setError({ name: error.data.err, message: error.data.msg });
    } else {
      setError({ name: 'Unknown error', message: 'An unknown error occurred' });
    }
  };

  const handleOnClick = () => {
    setShowDeleteModal(true);
  };

  if (!canDelete) {
    const tooltipContent = canEdit ? (
      <>
        Unable to delete the probe because it is currently in use.
        <br />
        <ProbeUsageLink variant="bodySmall" probe={probe} />.
      </>
    ) : (
      <>
        You do not have sufficient permissions
        <br />
        to delete the probe <span className={styles.probeName}>&apos;{probe.name}&apos;</span>.
      </>
    );

    return (
      <Tooltip content={tooltipContent} interactive={canEdit && !canDelete}>
        <Button type="button" variant="destructive" disabled>
          Delete probe
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        icon={isPending ? 'fa fa-spinner' : undefined}
        type="button"
        variant="destructive"
        onClick={handleOnClick}
        disabled={isPending}
      >
        Delete probe
      </Button>
      {createPortal(
        <ConfirmModal
          async
          isOpen={showDeleteModal}
          title="Delete probe"
          body={
            <>
              Are you sure you want to delete this (<strong>{probe.name}</strong>) probe?
            </>
          }
          description="This action cannot be undone."
          confirmText="Delete probe"
          onConfirm={() => deleteProbe(probe)}
          onDismiss={() => setShowDeleteModal(false)}
          error={error}
          onError={handleError}
        />,
        document.body
      )}
    </>
  );
}

const getStyles = () => ({
  probeName: css({
    display: 'inline-block',
  }),
});