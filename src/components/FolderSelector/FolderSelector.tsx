import React, { useMemo, useState } from 'react';
import { Button, Combobox, ComboboxOption, Field, Input, LoadingPlaceholder, Modal, Stack } from '@grafana/ui';

import { GrafanaFolder } from 'types';
import { DEFAULT_FOLDER_TITLE } from 'data/folders.constants';
import { getFolderPath, useCreateFolder, useFolders } from 'data/useFolders';

interface FolderSelectorProps {
  value?: string;
  onChange: (folderUid: string | undefined) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function FolderSelector({ value, onChange, disabled, 'aria-label': ariaLabel }: FolderSelectorProps) {
  const { data: folders = [], isLoading } = useFolders();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const options: Array<ComboboxOption<string>> = useMemo(() => {
    const foldersMap = new Map(folders.map((f) => [f.uid, f]));

    return folders
      .map((folder) => ({
        label: getFolderPath(folder, foldersMap),
        value: folder.uid,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [folders]);

  const handleChange = (selected: ComboboxOption<string> | null) => {
    onChange(selected?.value ?? undefined);
  };

  const handleFolderCreated = (folder: GrafanaFolder) => {
    onChange(folder.uid);
    setShowCreateModal(false);
  };

  if (isLoading) {
    return <LoadingPlaceholder text="Loading folders..." />;
  }

  return (
    <Stack gap={1.5} alignItems="center">
      <Combobox
        options={options}
        value={value ?? null}
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
      {showCreateModal && (
        <CreateFolderModal
          onCreated={handleFolderCreated}
          onDismiss={() => setShowCreateModal(false)}
        />
      )}
    </Stack>
  );
}

interface CreateFolderModalProps {
  onCreated: (folder: GrafanaFolder) => void;
  onDismiss: () => void;
}

function CreateFolderModal({ onCreated, onDismiss }: CreateFolderModalProps) {
  const [title, setTitle] = useState('');
  const { mutateAsync: createFolder, isPending } = useCreateFolder();

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    const folder = await createFolder({ title: title.trim() });
    onCreated(folder);
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
