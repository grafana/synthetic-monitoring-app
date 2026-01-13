import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Field, Icon, Input, Modal, Select, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useCreateFolder, useFolder, useFolders } from 'data/useFolders';

interface FolderSelectorProps {
  value?: string;
  onChange: (folderUid?: string) => void;
  required?: boolean;
  disabled?: boolean;
  includeRoot?: boolean;
}

export const FolderSelector = ({
  value,
  onChange,
  required = false,
  disabled = false,
  includeRoot = true,
}: FolderSelectorProps) => {
  const styles = useStyles2(getStyles);
  const { data: folders = [], isLoading } = useFolders();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const folderInfo = useFolder(value, Boolean(value));

  const options: Array<SelectableValue<string>> = [
    ...(includeRoot ? [{ label: 'Root (No folder)', value: '', description: 'Check will not be in a folder' }] : []),
    ...folders.map((folder) => {
      return {
        label: folder.title,
        value: folder.uid,
        description: buildFolderDescription(folder),
        icon: 'folder' as const,
      };
    }),
  ];

  // If current value is an orphaned folder, add it to options so it displays
  if (value && folderInfo.isOrphaned && !options.find((opt) => opt.value === value)) {
    options.push({
      label: `${value} (Folder deleted)`,
      value: value,
      description: 'This folder no longer exists',
      icon: 'folder' as const,
    });
  }

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div>
      <Field label="Folder" description="Organize checks into folders with RBAC permissions" required={required}>
        <Stack direction="row" gap={1}>
          <div className={styles.selectContainer}>
            <Select //eslint-disable-line @typescript-eslint/no-deprecated
              options={options}
              value={selectedOption}
              onChange={(selected) => {
                onChange(selected?.value);
              }}
              placeholder={isLoading ? 'Loading folders...' : 'Select a folder'}
              disabled={disabled || isLoading}
              isClearable={!required && includeRoot}
              aria-label="Select folder"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setShowCreateModal(true);
            }}
            disabled={disabled}
            tooltip="Create a new folder"
          >
            <Icon name="plus" />
          </Button>
        </Stack>
      </Field>

      {value && <FolderPermissionHint folderUid={value} />}

      {showCreateModal && (
        <CreateFolderModal
          onClose={() => {
            setShowCreateModal(false);
          }}
          onSuccess={(newFolder) => {
            setShowCreateModal(false);
            onChange(newFolder.uid);
          }}
        />
      )}
    </div>
  );
};

const FolderPermissionHint = ({ folderUid }: { folderUid: string }) => {
  const styles = useStyles2(getStyles);
  const folderInfo = useFolder(folderUid);

  // Still loading
  if (folderInfo.isLoading) {
    return null;
  }

  // Show warning for orphaned/deleted folders
  if (folderInfo.isOrphaned) {
    return (
      <div className={styles.warningHint}>
        <Stack direction="row" gap={1} alignItems="center">
          <Icon name="exclamation-triangle" />
          <span>
            The folder {folderUid} no longer exists. Please select a different folder or leave it at the root level.
          </span>
        </Stack>
      </div>
    );
  }

  // Show permissions for accessible folders
  if (folderInfo.hasAccess && folderInfo.folder) {
    const permissions = [
      folderInfo.canEdit && 'edit',
      folderInfo.canDelete && 'delete',
      folderInfo.canAdmin && 'manage permissions',
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <div className={styles.permissionHint}>
        <Stack direction="row" gap={1}>
          <Icon name="shield" />
          <span>You can: {permissions}</span>
        </Stack>
      </div>
    );
  }

  return null;
};

interface CreateFolderModalProps {
  onClose: () => void;
  onSuccess: (folder: any) => void;
}

const CreateFolderModal = ({ onClose, onSuccess }: CreateFolderModalProps) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>();
  const createFolder = useCreateFolder();

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      const folder = await createFolder.mutateAsync({ title: title.trim() });
      onSuccess(folder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  return (
    <Modal title="Create New Folder" onDismiss={onClose} isOpen>
      <div>
        <Field
          label="Folder Name"
          description="A descriptive name for organizing your checks"
          error={error}
          invalid={Boolean(error)}
        >
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
              setError(undefined);
            }}
            placeholder="e.g., Production, Staging, Team ABC"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </Field>
      </div>

      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!title.trim() || createFolder.isPending}>
          {createFolder.isPending ? 'Creating...' : 'Create Folder'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};

function buildFolderDescription(folder: any): string {
  const parts: string[] = [];

  if (folder.parents && folder.parents.length > 0) {
    parts.push(`Path: ${folder.parents.map((p: any) => p.title).join(' > ')} > ${folder.title}`);
  }

  const permissions: string[] = [];
  if (folder.canSave) {
    permissions.push('create');
  }
  if (folder.canEdit) {
    permissions.push('edit');
  }
  if (folder.canDelete) {
    permissions.push('delete');
  }

  if (permissions.length > 0) {
    parts.push(`Permissions: ${permissions.join(', ')}`);
  }

  return parts.join(' • ');
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    selectContainer: css({
      flex: 1,
    }),
    permissionHint: css({
      marginTop: theme.spacing(1),
      padding: theme.spacing(1),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
    }),
    warningHint: css({
      marginTop: theme.spacing(1),
      padding: theme.spacing(1),
      backgroundColor: theme.colors.warning.transparent,
      border: `1px solid ${theme.colors.warning.border}`,
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.warning.text,
    }),
  };
};
