import React, { useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, ConfirmModal as GrafanaConfirmModal, ConfirmModalProps, Modal, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface ConfirmError {
  name: string;
  message: string;
}

interface AsyncConfirmModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
  async: boolean;
  error?: ConfirmError;
  onSuccess?: (response: unknown) => void;
  onError?: (error: ConfirmError) => void;
  onConfirm?: () => Promise<unknown>;
}

export function ConfirmModal(props: ConfirmModalProps | AsyncConfirmModalProps) {
  if (!('async' in props)) {
    return <GrafanaConfirmModal {...props} />;
  }

  return <AsyncConfirmModal {...props} />;
}

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Unable to fulfill the requested action.';

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

  const handleConfirm = () => {
    if (pending) {
      return;
    }
    setPending(true);
    props
      .onConfirm?.()
      .then((response: unknown) => {
        props.onSuccess?.(response);
        handleDismiss();
      })
      .catch((error: ConfirmError) => {
        if ('onError' in props && typeof props.onError === 'function') {
          props.onError(error);
          return;
        }

        if (
          error &&
          'message' in error &&
          typeof error.message === 'string' &&
          'name' in error &&
          typeof error.name === 'string'
        ) {
          setError(error);
        } else {
          setError({ name: `${title} error`, message: GENERIC_ERROR_MESSAGE });
        }
      })
      .finally(() => {
        setPending(false);
      });
  };

  return (
    <Modal className={styles.modal} title={title} isOpen={isOpen} onDismiss={handleDismiss}>
      {!!error && (
        <Alert title={error?.name ?? `${title} error`} severity="error">
          <div>{error?.message ?? GENERIC_ERROR_MESSAGE}</div>
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
