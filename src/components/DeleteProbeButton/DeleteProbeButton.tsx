import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import type { BackendError, DeleteProbeButtonProps } from './DeleteProbeButton.types';
import { useDeleteProbe } from 'data/useProbes';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { ConfirmModal } from 'components/ConfirmModal';
import { ProbeUsageLink } from 'components/ProbeUsageLink';

import { getPrettyError } from './DeleteProbeButton.utils';

export function DeleteProbeButton({ probe, onDeleteSuccess: _onDeleteSuccess }: DeleteProbeButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const onDeleteSuccess = useCallback(() => {
    setShowDeleteModal(false);
    _onDeleteSuccess?.();
  }, [_onDeleteSuccess]);

  const { mutateAsync: deleteProbe, isPending } = useDeleteProbe({ onSuccess: onDeleteSuccess });

  const { canDeleteProbes } = useCanEditProbe();

  const canDelete = canDeleteProbes && !probe.checks.length;
  const styles = getStyles();
  const [error, setError] = useState<undefined | { name: string; message: string }>();

  const handleError = (error: Error | BackendError) => {
    if (!error) {
      setError(undefined);
    }

    setError(getPrettyError(error, probe));
  };

  const handleOnClick = () => {
    setShowDeleteModal(true);
  };

  if (!canDelete) {
    const tooltipContent = canDeleteProbes ? (
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

    // Both tooltip component and button prob is used for accessibility reasons
    return (
      <Tooltip content={tooltipContent} interactive={canDeleteProbes && !canDelete}>
        <Button type="button" variant="destructive" tooltip={tooltipContent} disabled>
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
