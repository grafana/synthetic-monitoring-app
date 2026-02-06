import React from 'react';
import { Button, Modal, Text } from '@grafana/ui';
import { UI_TEST_ID } from 'test/dataTestIds';

interface ConfirmUnsavedModalProps {
  onLeavePage: () => void;
  onStayOnPage: () => void;
}

export function ConfirmUnsavedModal({ onLeavePage, onStayOnPage }: ConfirmUnsavedModalProps) {
  return (
    <Modal isOpen title="Unsaved changes" onDismiss={onStayOnPage}>
      <Text data-testid={UI_TEST_ID.modals.confirmUnsavedHeading} element="span" variant="h5">
        You have unsaved changes. Are you sure you want to leave this page?
      </Text>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onStayOnPage} fill="outline">
          Stay on page
        </Button>
        <Button onClick={onLeavePage} variant="destructive">
          Leave page
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
