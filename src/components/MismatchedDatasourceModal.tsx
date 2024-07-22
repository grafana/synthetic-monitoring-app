import React from 'react';
import { Button, Modal } from '@grafana/ui';

interface MismatchedDatasourceModalProps {
  disabled?: boolean;
  isOpen: boolean;
  loading?: boolean;
  onDismiss: () => void;
  onSubmit: () => void;
}

// todo: rename this modal
export function MismatchedDatasourceModal({
  isOpen,
  disabled,
  loading,
  onDismiss,
  onSubmit,
}: MismatchedDatasourceModalProps) {
  return (
    <Modal isOpen={isOpen} title="Datasource selection">
      Choose the datasource you want to use for Synthetic Monitoring.
      <Modal.ButtonRow>
        <Button variant="secondary" fill="outline" onClick={onDismiss}>
          Cancel
        </Button>
        <Button disabled={disabled} onClick={onSubmit} icon={loading ? `fa fa-spinner` : undefined}>
          Proceed
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
