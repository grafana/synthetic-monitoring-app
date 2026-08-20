import React, { useMemo, useState } from 'react';
import { FolderPicker } from '@grafana/runtime';
import { Alert, Button, Field, Modal, Text } from '@grafana/ui';

import { GrafanaFolder } from 'types';
import { useUserPermissions } from 'data/permissions';
import { useAllFolders, useMoveFolder } from 'data/useFolders';

interface MoveFolderModalProps {
  folder: GrafanaFolder;
  onDismiss: () => void;
}

/**
 * Move a folder to a new location anywhere in the Grafana folder tree,
 * picked with Grafana's own nested folder picker (edit-filtered
 * server-side). The folder's permissions follow its new location (it
 * inherits from the new parent).
 */
export function MoveFolderModal({ folder, onDismiss }: MoveFolderModalProps) {
  const { foldersMap } = useAllFolders();
  const { canCreateFolders } = useUserPermissions();
  const { mutateAsync: moveFolder, isPending } = useMoveFolder();
  const [error, setError] = useState<string | null>(null);

  // Exclude the folder itself and its known descendants. The current parent
  // stays visible (hiding it made users think their target folder was
  // missing and move to root by accident); picking it is handled as a no-op
  // below. Descendants outside the SM subtree are not known client-side;
  // Grafana rejects circular moves server-side and the error is surfaced
  // below.
  const excludeUIDs = useMemo(() => {
    const excluded = new Set<string>([folder.uid]);

    const isDescendantOfMoved = (candidate: GrafanaFolder): boolean => {
      let current: GrafanaFolder | undefined = candidate;
      const visited = new Set<string>();
      while (current?.parentUid && !visited.has(current.parentUid)) {
        if (current.parentUid === folder.uid) {
          return true;
        }
        visited.add(current.parentUid);
        current = foldersMap.get(current.parentUid);
      }
      return false;
    };

    foldersMap.forEach((candidate) => {
      if (isDescendantOfMoved(candidate)) {
        excluded.add(candidate.uid);
      }
    });

    return [...excluded];
  }, [folder.uid, foldersMap]);

  // No destination is preselected: moving a folder is deliberate, so the
  // user must pick one explicitly before Move enables ('' means the Grafana
  // root level).
  const [destination, setDestination] = useState<string | undefined>(undefined);

  // Picking the folder's current location is a no-op; Move stays disabled
  // and we say why instead of hiding the parent from the picker.
  const isNoOpMove = destination !== undefined && destination === (folder.parentUid ?? '');

  const handleMove = async () => {
    if (destination === undefined || isNoOpMove) {
      return;
    }
    setError(null);
    try {
      await moveFolder({ uid: folder.uid, parentUid: destination });
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to move folder');
    }
  };

  // Moving to root requires org-level folders:create; the root item is only
  // offered when the user has it (and the folder is not already at root).
  const showRootFolder = canCreateFolders && Boolean(folder.parentUid);

  return (
    <Modal title={`Move folder "${folder.title}"`} isOpen onDismiss={onDismiss}>
      <Field
        label="New location"
        description={showRootFolder ? `"Dashboards" is the top level of Grafana.` : undefined}
        invalid={isNoOpMove}
        error={isNoOpMove ? 'The folder is already in this location.' : undefined}
      >
        <FolderPicker
          value={destination}
          onChange={(uid) => setDestination(uid)}
          showRootFolder={showRootFolder}
          excludeUIDs={excludeUIDs}
        />
      </Field>
      <Text color="secondary" element="p">
        The folder keeps its contents. Its permissions follow the new location.
      </Text>
      {error && <Alert title={error} severity="error" />}
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} type="button">
          Cancel
        </Button>
        <Button type="button" onClick={handleMove} disabled={destination === undefined || isNoOpMove || isPending}>
          {isPending ? 'Moving...' : 'Move'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
