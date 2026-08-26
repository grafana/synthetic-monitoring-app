import React, { useState } from 'react';
import { Button, ConfirmModal, Dropdown, Icon, Menu } from '@grafana/ui';

import { Check, GrafanaFolder } from 'types';
import { useIsFoldersAvailable } from 'contexts/CheckFolderAccessContext';
import { BulkMoveToFolderModal } from 'page/CheckList/components/BulkMoveToFolderModal';
import { MoveFolderModal } from 'page/CheckList/components/MoveFolderModal';

import { useBulkActions } from './BulkActions.hooks';

interface FolderActionsMenuProps {
  folderTitle: string;
  /** Every check in the folder, nested descendants included. */
  checks: Check[];
  onResolved: () => void;
  /** When set, the menu offers moving this folder elsewhere in Grafana. */
  moveFolder?: GrafanaFolder;
}

/**
 * Always-visible per-folder "Actions" menu, modeled on the folder actions in
 * Alerting's rule list. Every item operates on the whole folder (nested
 * checks included); acting on a subset of checks stays with checkbox
 * selection. Folder-level operations other than moving (rename, delete,
 * permissions) live in Dashboards > Folders, not here.
 */
export function FolderActionsMenu({ folderTitle, checks, onResolved, moveFolder }: FolderActionsMenuProps) {
  const isFoldersAvailable = useIsFoldersAvailable();
  const {
    canWriteAll,
    canDeleteAll,
    showDeleteModal,
    setShowDeleteModal,
    showMoveToFolderModal,
    setShowMoveToFolderModal,
    handleMoveResolved,
    enableChecks,
    disableChecks,
    deleteChecks,
    deleteModalProps,
  } = useBulkActions({ checks, onResolved, isFoldersAvailable });
  const [showMoveFolderModal, setShowMoveFolderModal] = useState(false);

  if (!canWriteAll && !canDeleteAll && !moveFolder) {
    return null;
  }

  const menu = (
    <Menu>
      <Menu.Item label="Enable all checks" icon="check-circle" disabled={!canWriteAll} onClick={enableChecks} />
      <Menu.Item label="Disable all checks" icon="pause-circle" disabled={!canWriteAll} onClick={disableChecks} />
      {isFoldersAvailable && (
        <Menu.Item
          label="Move checks to folder"
          icon="folder"
          disabled={!canWriteAll}
          onClick={() => setShowMoveToFolderModal(true)}
        />
      )}
      <Menu.Item
        label="Delete all checks"
        icon="trash-alt"
        destructive
        disabled={!canDeleteAll}
        onClick={() => setShowDeleteModal(true)}
      />
      {moveFolder && (
        <>
          <Menu.Divider />
          <Menu.Item label="Move folder" icon="folder-upload" onClick={() => setShowMoveFolderModal(true)} />
        </>
      )}
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} placement="bottom-end">
        {/* The aria-label includes the folder title to keep accessible names
            unique across folder rows. */}
        <Button variant="secondary" size="sm" fill="outline" aria-label={`Actions for folder ${folderTitle}`}>
          Actions <Icon name="angle-down" />
        </Button>
      </Dropdown>
      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          {...deleteModalProps}
          onConfirm={deleteChecks}
          onDismiss={() => setShowDeleteModal(false)}
        />
      )}
      <BulkMoveToFolderModal
        checks={checks}
        isOpen={showMoveToFolderModal}
        onDismiss={() => setShowMoveToFolderModal(false)}
        onMoved={handleMoveResolved}
      />
      {showMoveFolderModal && moveFolder && (
        <MoveFolderModal folder={moveFolder} onDismiss={() => setShowMoveFolderModal(false)} />
      )}
    </>
  );
}
