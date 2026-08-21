import React, { useState } from 'react';
import { FolderPicker } from '@grafana/runtime';
import { Alert, Button, Field, Input, LoadingPlaceholder, Modal, Stack } from '@grafana/ui';
import { trackFolderCreated, trackFolderSelected } from 'features/tracking/folderEvents';

import { GrafanaFolder } from 'types';
import { useUserPermissions } from 'data/permissions';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { useFolderPermissions } from 'data/useFolderPermissions';
import { useCreateFolder } from 'data/useFolders';

interface FolderSelectorProps {
  value?: string;
  onChange: (folderUid: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Folder assignment for checks, built on Grafana's own nested folder picker:
 * a lazily-loaded, searchable tree of every folder the user can edit
 * (server-side permission filtering), so checks can live in any Grafana
 * folder, not just the default SM subtree.
 *
 * Preselection is not handled here: the check form seeds the default folder
 * through its form defaults (only when the user can edit it, see
 * useFolderSelection), so a pristine form stays clean.
 */
export function FolderSelector({ value, onChange, disabled }: FolderSelectorProps) {
  const { defaultFolder, defaultFolderUid, isLoading, isError, refetch } = useDefaultFolder();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // In the disabled state we render a plain read-only input (the runtime
  // FolderPicker has no disabled prop), which needs the folder's title.
  const disabledValueUids = disabled && value ? [value] : [];
  const { folderDetailsByUid } = useFolderPermissions(disabledValueUids);

  const handleChange = (folderUid: string | undefined) => {
    if (folderUid) {
      trackFolderSelected({ isDefault: folderUid === defaultFolderUid });
    }
    onChange(folderUid || undefined);
  };

  const handleFolderCreated = (folder: GrafanaFolder) => {
    trackFolderCreated();
    onChange(folder.uid);
    setShowCreateModal(false);
  };

  if (isLoading) {
    return <LoadingPlaceholder text="Loading folders..." />;
  }

  if (isError) {
    return <Alert title="Unable to load folders" severity="warning" buttonContent="Retry" onRemove={() => refetch()} />;
  }

  if (disabled) {
    const valueState = value ? folderDetailsByUid.get(value) : undefined;
    const title = valueState?.type === 'accessible' ? valueState.folder?.title : value;
    return <Input value={title ?? ''} disabled aria-label="Folder" />;
  }

  return (
    <Stack gap={1.5} alignItems="center">
      <FolderPicker value={value} onChange={handleChange} showRootFolder={false} />
      {defaultFolder?.canSave && (
        <>
          <span>or</span>
          <Button variant="secondary" size="md" icon="plus" onClick={() => setShowCreateModal(true)} type="button">
            Create folder
          </Button>
        </>
      )}
      {showCreateModal && defaultFolderUid && (
        <CreateFolderModal
          defaultParentUid={defaultFolderUid}
          onCreated={handleFolderCreated}
          onDismiss={() => setShowCreateModal(false)}
        />
      )}
    </Stack>
  );
}

interface CreateFolderModalProps {
  defaultParentUid: string;
  onCreated: (folder: GrafanaFolder) => void;
  onDismiss: () => void;
}

function CreateFolderModal({ defaultParentUid, onCreated, onDismiss }: CreateFolderModalProps) {
  const [title, setTitle] = useState('');
  // '' selects the Grafana root level (the picker's "Dashboards" item).
  const [parentUid, setParentUid] = useState<string>(defaultParentUid);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createFolder, isPending } = useCreateFolder();
  const { canCreateFolders } = useUserPermissions();

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setError(null);

    try {
      const folder = await createFolder({ title: title.trim(), parentUid: parentUid === '' ? undefined : parentUid });
      onCreated(folder);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    }
  };

  return (
    <Modal title="Create folder" isOpen onDismiss={onDismiss}>
      <Field
        label="Parent folder"
        description="Where the new folder is created. Creating at the top level (Dashboards) requires org-level folder creation rights."
      >
        {/* Root creation requires org-level folders:create, so the root item
            is only offered when the user has it. */}
        <FolderPicker value={parentUid} onChange={(uid) => setParentUid(uid ?? '')} showRootFolder={canCreateFolders} />
      </Field>
      <Field label="Folder name">
        <Input
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          placeholder="Enter folder name"
          autoFocus
        />
      </Field>
      {error && <Alert title={error} severity="error" />}
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} type="button">
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!title.trim() || isPending}>
          {isPending ? 'Creating...' : 'Create'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
