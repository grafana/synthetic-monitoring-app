import React, { useMemo, useState } from 'react';
import { Alert, Button, Combobox, ComboboxOption, Field, Input, LoadingPlaceholder, Modal, Stack } from '@grafana/ui';
import { trackFolderCreated, trackFolderSelected } from 'features/tracking/folderEvents';

import { GrafanaFolder } from 'types';
import { FolderAccessState } from 'data/folderPermissions';
import { getFolderPathParts, useCreateFolder } from 'data/useFolders';

import { useFolderSelection } from './FolderSelector.hooks';

interface FolderSelectorProps {
  value?: string;
  onChange: (folderUid: string | undefined) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function FolderSelector({ value, onChange, disabled, 'aria-label': ariaLabel }: FolderSelectorProps) {
  const {
    defaultFolder,
    defaultFolderUid,
    allFolders,
    folderDetailsByUid,
    editableFolders,
    noStorableFolders,
    isLoading,
    isDefaultError,
    isChildrenError,
    refetchDefault,
    refetchChildren,
  } = useFolderSelection({ value });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isError = isDefaultError || isChildrenError;

  const options: Array<ComboboxOption<string>> = useMemo(() => {
    if (!defaultFolder) {
      return [];
    }

    const foldersMap = new Map(allFolders.map((f) => [f.uid, f]));

    const result: Array<ComboboxOption<string>> = editableFolders.map((folder) => {
      if (folder.uid === defaultFolder.uid) {
        return { label: `${folder.title} (Default)`, value: folder.uid };
      }

      const parts = getFolderPathParts(folder, foldersMap);
      const withoutRoot = parts.length > 1 ? parts.slice(1) : parts;
      return { label: withoutRoot.join(' > '), value: folder.uid };
    });

    result.sort((a, b) => {
      if (a.value === defaultFolder.uid) {
        return -1;
      }
      if (b.value === defaultFolder.uid) {
        return 1;
      }
      return (a.label ?? '').localeCompare(b.label ?? '');
    });

    if (value && !result.some((opt) => opt.value === value)) {
      result.push(toSelectedFolderOption(value, folderDetailsByUid.get(value)));
    }

    return result;
  }, [allFolders, editableFolders, defaultFolder, value, folderDetailsByUid]);

  const handleChange = (selected: ComboboxOption<string> | null) => {
    if (selected?.value) {
      trackFolderSelected({ isDefault: selected.value === defaultFolderUid });
    }
    onChange(selected?.value ?? undefined);
  };

  const handleFolderCreated = (folder: GrafanaFolder) => {
    trackFolderCreated();
    onChange(folder.uid);
    setShowCreateModal(false);
  };

  const selectedValue = value ?? null;

  if (isLoading) {
    return <LoadingPlaceholder text="Loading folders..." />;
  }

  if (isError) {
    const handleRetry = () => {
      if (isDefaultError) {
        refetchDefault();
      }
      if (isChildrenError) {
        refetchChildren();
      }
    };

    return (
      <Alert title="Unable to load folders" severity="warning" buttonContent="Retry" onRemove={handleRetry} />
    );
  }

  // No editable folder and no rights to create one: explain the dead end
  // instead of rendering an empty dropdown. The suggestion points at the
  // default subtree because that is all this picker can list.
  if (noStorableFolders && !value) {
    return (
      <Alert title="You don't have permission to store checks in any folder" severity="warning">
        Storing a check requires Edit permission on a folder. Ask an administrator to grant you Edit access to the
        &quot;{defaultFolder?.title}&quot; folder or one of its subfolders.
      </Alert>
    );
  }

  return (
    <Stack gap={1.5} alignItems="center">
      <Combobox
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder="Select a folder"
        disabled={disabled}
        aria-label={ariaLabel}
      />
      {!disabled && defaultFolder?.canSave && (
        <>
          <span>or</span>
          <Button
            variant="secondary"
            size="md"
            icon="plus"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            Create folder
          </Button>
        </>
      )}
      {showCreateModal && defaultFolderUid && (
        <CreateFolderModal
          parentOptions={options}
          defaultParentUid={defaultFolderUid}
          onCreated={handleFolderCreated}
          onDismiss={() => setShowCreateModal(false)}
        />
      )}
    </Stack>
  );
}

/**
 * Labels a selected folder the picker doesn't list (read-only, inaccessible,
 * or deleted). The suffix lives in the label because the closed combobox only
 * shows the label; the description explains it in the dropdown.
 */
function toSelectedFolderOption(value: string, state: FolderAccessState | undefined): ComboboxOption<string> {
  switch (state?.type) {
    case 'accessible': {
      const title = state.folder?.title ?? value;
      if (state.permissions.canEdit) {
        return { label: title, value };
      }
      return {
        label: `${title} (read-only)`,
        value,
        description: 'You can view this folder but not save checks into it.',
      };
    }
    case 'forbidden':
      return {
        label: `${value} (no access)`,
        value,
        description: "You don't have permission to view this folder, so its identifier is shown instead of its name.",
      };
    case 'loading':
      // Lookup in flight: don't flash a false "not found".
      return { label: value, value };
    default:
      return {
        label: `${value} (folder not found)`,
        value,
        description: 'This folder no longer exists. It may have been deleted.',
      };
  }
}

interface CreateFolderModalProps {
  parentOptions: Array<ComboboxOption<string>>;
  defaultParentUid: string;
  onCreated: (folder: GrafanaFolder) => void;
  onDismiss: () => void;
}

function CreateFolderModal({ parentOptions, defaultParentUid, onCreated, onDismiss }: CreateFolderModalProps) {
  const [title, setTitle] = useState('');
  const [selectedParentUid, setSelectedParentUid] = useState<string>(defaultParentUid);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createFolder, isPending } = useCreateFolder();

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setError(null);

    try {
      const folder = await createFolder({ title: title.trim(), parentUid: selectedParentUid });
      onCreated(folder);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    }
  };

  return (
    <Modal title="Create folder" isOpen onDismiss={onDismiss}>
      {parentOptions.length > 1 && (
        <Field label="Parent folder">
          <Combobox
            options={parentOptions}
            value={selectedParentUid}
            onChange={(selected) => { if (selected) { setSelectedParentUid(selected.value); } }}
            aria-label="Select parent folder"
          />
        </Field>
      )}
      <Field label="Folder name">
        <Input
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { handleSubmit(); } }}
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
