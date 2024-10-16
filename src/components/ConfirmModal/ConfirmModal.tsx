import React, { useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, ConfirmModal as GrafanaConfirmModal, ConfirmModalProps, Modal, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import type { AsyncConfirmModalProps } from './ConfirmModal.types';

import { GENERIC_ERROR_MESSAGE } from './ConfirmModal.constants';
import { getErrorWithFallback, hasOnError } from './ConfirmModal.utils';

export function ConfirmModal(props: ConfirmModalProps | AsyncConfirmModalProps) {
  if (!('async' in props)) {
    return <GrafanaConfirmModal {...props} />;
  }

  return <AsyncConfirmModal {...props} />;
}

export function AsyncConfirmModal({
  title,
  isOpen,
  description,
  error: _error,
  onDismiss,
  body,
  dismissText = 'Cancel',
  confirmText = 'Confirm',
  ...props
}: AsyncConfirmModalProps) {
  const [error, setError] = useState<AsyncConfirmModalProps['error']>(_error);
  const [pending, setPending] = useState<boolean>(false);
  const theme2 = useTheme2();
  useEffect(() => {
    setError(_error);
  }, [_error]);

  useEffect(() => {
    if (!isOpen) {
      setError(undefined);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    !pending && onDismiss?.();
  };

  const styles = getStyles(theme2);

  const disabled = pending || error !== undefined;

  const handleConfirm = async () => {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const response = await props.onConfirm?.();
      props.onSuccess?.(response);
      handleDismiss();
    } catch (error: any) {
      if (hasOnError(props)) {
        props.onError(error);
        return;
      }

      setError(getErrorWithFallback(error, title));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal className={styles.modal} title={title} isOpen={isOpen} onDismiss={handleDismiss}>
      {!!error && (
        <Alert className={styles.alert} title={error?.name ?? `${title} error`} severity="error">
          <div>{error.message ?? GENERIC_ERROR_MESSAGE}</div>
        </Alert>
      )}
      <div className={styles.body}>{body}</div>
      {!!description && <div className={styles.description}>{description}</div>}
      <Modal.ButtonRow>
        <Button variant="secondary" fill="outline" onClick={handleDismiss}>
          {dismissText}
        </Button>
        <Button
          disabled={disabled}
          icon={pending ? 'fa fa-spinner' : undefined}
          variant="destructive"
          onClick={handleConfirm}
        >
          {confirmText}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  // Same as (grafana/ui) ConfirmModal
  modal: css({
    width: '100%',
    maxWidth: '500px',
  }),
  alert: css({
    '& *:first-letter': {
      textTransform: 'uppercase',
    },
  }),
  body: css({
    fontSize: theme.typography.h5.fontSize,
  }),
  description: css({
    fontSize: theme.typography.body.fontSize,
  }),
  error: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error.text,
  }),
});
