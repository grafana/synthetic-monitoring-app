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
  const { foldersMap, defaultFolderUid } = useAllFolders();
  const { canCreateFolders } = useUserPermissions();
  const { mutateAsync: moveFolder, isPending } = useMoveFolder();
  const [error, setError] = useState<string | null>(null);

  // Exclude the folder itself, its current parent (a no-op move) and its
  // known descendants. Descendants outside the SM subtree are not known
  // client-side; Grafana rejects circular moves server-side and the error is
  // surfaced below.
  const excludeUIDs = useMemo(() => {
    const excluded = new Set<string>([folder.uid]);
    if (folder.parentUid) {
      excluded.add(folder.parentUid);
    }

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
  }, [folder.uid, folder.parentUid, foldersMap]);

  // '' selects the Grafana root level. Preselect the "other" location:
  // the default folder for folders at root, root for everything else
  // (when the user is allowed to create at root).
  const [destination, setDestination] = useState<string | undefined>(() => {
    if (!folder.parentUid) {
      return defaultFolderUid;
    }
    return canCreateFolders ? '' : undefined;
  });

  const handleMove = async () => {
    if (destination === undefined) {
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
      <Field label="New location">
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
        <Button type="button" onClick={handleMove} disabled={destination === undefined || isPending}>
          {isPending ? 'Moving...' : 'Move'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
