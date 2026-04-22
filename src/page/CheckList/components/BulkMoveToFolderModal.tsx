import React, { useState } from 'react';
import { Alert, Button, Field, Modal } from '@grafana/ui';

import { Check } from 'types';
import { useBulkUpdateChecks } from 'data/useChecks';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

interface BulkMoveToFolderModalProps {
  checks: Check[];
  isOpen: boolean;
  onDismiss: () => void;
  onMoved: () => void;
}

export function BulkMoveToFolderModal(props: BulkMoveToFolderModalProps) {
  return (
    <QueryErrorBoundary>
      <BulkMoveToFolderModalContent {...props} />
    </QueryErrorBoundary>
  );
}

function BulkMoveToFolderModalContent({ checks, isOpen, onDismiss, onMoved }: BulkMoveToFolderModalProps) {
  const [targetFolderUid, setTargetFolderUid] = useState<string | undefined>();
  const { mutate: bulkUpdateChecks, isPending, isError } = useBulkUpdateChecks({ onSuccess: onMoved });

  const handleSubmit = () => {
    if (!targetFolderUid) {
      return;
    }

    const updatedChecks = checks.map((check) => ({ ...check, folderUid: targetFolderUid }));
    bulkUpdateChecks(updatedChecks);
  };

  return (
    <Modal
      title={`Move ${checks.length} check${checks.length !== 1 ? 's' : ''} to folder`}
      isOpen={isOpen}
      onDismiss={onDismiss}
    >
      {isError && (
        <Alert title="Bulk move failed" severity="error">
          The move operation failed. Try selecting fewer checks and retrying.
        </Alert>
      )}
      <Field label="Target folder" description="All selected checks will be moved to this folder.">
        <FolderSelector
          value={targetFolderUid}
          onChange={setTargetFolderUid}
          autoSelectDefault={false}
          aria-label="Select target folder"
        />
      </Field>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} type="button">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!targetFolderUid || isPending}
          icon={isPending ? 'fa fa-spinner' : undefined}
        >
          {isPending ? 'Moving...' : 'Move'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
