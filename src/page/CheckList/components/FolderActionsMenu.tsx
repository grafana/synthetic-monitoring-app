import React, { useState } from 'react';
import { Button, ConfirmModal, Dropdown, Icon, Menu, Stack } from '@grafana/ui';
import { trackMoveFolderClicked } from 'features/tracking/folderEvents';

import { Check, GrafanaFolder } from 'types';
import { useIsFoldersAvailable } from 'contexts/CheckFolderAccessContext';
import { BulkMoveToFolderModal } from 'page/CheckList/components/BulkMoveToFolderModal';
import { MoveFolderModal } from 'page/CheckList/components/MoveFolderModal';

import { useBulkActions } from './BulkActions.hooks';

interface FolderActionsMenuProps {
  folderTitle: string;
  /** Every check in the folder, nested descendants included. */
  checks: Check[];
  /** The currently selected checks within this folder, if any. */
  selectedChecks: Check[];
  onResolved: () => void;
  /** When set, the menu offers moving this folder elsewhere in Grafana. */
  moveFolder?: GrafanaFolder;
}

/**
 * Always-visible per-folder "Actions" menu, modeled on the folder actions in
 * Alerting's rule list. Check-level items follow the selection: they operate
 * on the selected checks when there is a selection within the folder, and on
 * every check in the folder (nested descendants included) otherwise. Items
 * the user lacks permission for stay visible but disabled, with the reason
 * shown as the item description.
 * Folder-level operations other than moving (rename, delete, permissions)
 * live in Dashboards > Folders, not here.
 */
export function FolderActionsMenu({
  folderTitle,
  checks,
  selectedChecks,
  onResolved,
  moveFolder,
}: FolderActionsMenuProps) {
  const isFoldersAvailable = useIsFoldersAvailable();
  const hasSelection = selectedChecks.length > 0;
  const targetChecks = hasSelection ? selectedChecks : checks;
  const targetLabel = hasSelection ? 'selected checks' : 'all checks';
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
  } = useBulkActions({ checks: targetChecks, onResolved });
  const [showMoveFolderModal, setShowMoveFolderModal] = useState(false);

  const targetDescription = hasSelection ? 'all selected checks' : 'every check in this folder';
  const writeDisabledReason = canWriteAll ? undefined : `You need edit access to ${targetDescription}`;
  const deleteDisabledReason = canDeleteAll ? undefined : `You need delete access to ${targetDescription}`;

  const menu = (
    <Menu>
      <Menu.Item
        label={`Enable ${targetLabel}`}
        icon="check-circle"
        disabled={!canWriteAll}
        description={writeDisabledReason}
        onClick={enableChecks}
      />
      <Menu.Item
        label={`Disable ${targetLabel}`}
        icon="pause-circle"
        disabled={!canWriteAll}
        description={writeDisabledReason}
        onClick={disableChecks}
      />
      {isFoldersAvailable && (
        <Menu.Item
          label={`Move ${targetLabel} to folder`}
          icon="folder"
          disabled={!canWriteAll}
          description={writeDisabledReason}
          onClick={() => setShowMoveToFolderModal(true)}
        />
      )}
      <Menu.Item
        label={`Delete ${targetLabel}`}
        icon="trash-alt"
        destructive
        disabled={!canDeleteAll}
        description={deleteDisabledReason}
        onClick={() => setShowDeleteModal(true)}
      />
      {moveFolder && (
        <>
          <Menu.Divider />
          <Menu.Item
            label="Move folder"
            icon="folder-upload"
            onClick={() => {
              trackMoveFolderClicked();
              setShowMoveFolderModal(true);
            }}
          />
        </>
      )}
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} placement="bottom-end">
        <Button
          variant="secondary"
          size="sm"
          fill="text"
          type="button"
          aria-label={`Actions for folder ${folderTitle}`}
        >
          <Stack direction="row" alignItems="center" gap={0}>
            Actions
            <Icon name="angle-down" />
          </Stack>
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
        checks={targetChecks}
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
