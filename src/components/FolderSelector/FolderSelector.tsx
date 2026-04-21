import React, { useMemo, useState } from 'react';
import { Alert, Button, Combobox, ComboboxOption, Field, Input, LoadingPlaceholder, Modal, Stack } from '@grafana/ui';
import { trackFolderCreated, trackFolderSelected } from 'features/tracking/folderEvents';

import { GrafanaFolder } from 'types';
import { DEFAULT_FOLDER_TITLE } from 'data/folders.constants';
import { useDefaultFolder } from 'data/useDefaultFolder';
import { getFolderPath, useCreateFolder, useFolderChildren } from 'data/useFolders';

interface FolderSelectorProps {
  value?: string;
  onChange: (folderUid: string | undefined) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function FolderSelector({ value, onChange, disabled, 'aria-label': ariaLabel }: FolderSelectorProps) {
  const { defaultFolder, defaultFolderUid, isLoading: isDefaultLoading, isError: isDefaultError } = useDefaultFolder();
  const {
    data: childFolders = [],
    isLoading: isChildrenLoading,
    isError: isChildrenError,
  } = useFolderChildren(defaultFolderUid);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isLoading = isDefaultLoading || isChildrenLoading;
  const isError = isDefaultError || isChildrenError;

  const options: Array<ComboboxOption<string>> = useMemo(() => {
    if (!defaultFolder) {
      return [];
    }

    const allFolders = [defaultFolder, ...childFolders];
    const foldersMap = new Map(allFolders.map((f) => [f.uid, f]));

    const result = allFolders
      .map((folder) => ({
        label: getFolderPath(folder, foldersMap),
        value: folder.uid,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (value && !result.some((opt) => opt.value === value)) {
      result.push({ label: `${value} (folder not found)`, value });
    }

    return result;
  }, [childFolders, defaultFolder, value]);

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

  const selectedValue = value ?? defaultFolderUid ?? null;

  if (isLoading) {
    return <LoadingPlaceholder text="Loading folders..." />;
  }

  if (isError) {
    return <Alert title="Unable to load folders" severity="warning" />;
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
      {!disabled && (
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
          parentUid={defaultFolderUid}
          onCreated={handleFolderCreated}
          onDismiss={() => setShowCreateModal(false)}
        />
      )}
    </Stack>
  );
}

interface CreateFolderModalProps {
  parentUid: string;
  onCreated: (folder: GrafanaFolder) => void;
  onDismiss: () => void;
}

function CreateFolderModal({ parentUid, onCreated, onDismiss }: CreateFolderModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createFolder, isPending } = useCreateFolder();

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setError(null);

    try {
      const folder = await createFolder({ title: title.trim(), parentUid });
      onCreated(folder);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    }
  };

  return (
    <Modal title="Create folder" isOpen onDismiss={onDismiss}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Field label="Folder name" description={`The new folder will be created inside "${DEFAULT_FOLDER_TITLE}".`}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Enter folder name"
            autoFocus
          />
        </Field>
        {error && <Alert title={error} severity="error" />}
        <Modal.ButtonRow>
          <Button variant="secondary" onClick={onDismiss} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isPending}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </Modal.ButtonRow>
      </form>
    </Modal>
  );
}
