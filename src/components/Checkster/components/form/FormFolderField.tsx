import React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';
import { useFolderSelection } from 'components/FolderSelector/FolderSelector.hooks';

import { StyledField } from '../ui/StyledField';

export function FormFolderField() {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { field, fieldState } = useController({ name: 'folderUid', control });
  const { noStorableFolders } = useFolderSelection({ value: field.value, enabled: isFoldersEnabled });

  if (!isFoldersEnabled) {
    return null;
  }

  // When nothing can be selected, FolderSelector replaces the picker with an
  // alert that already explains the missing permissions, so the "select a
  // folder" error would only add noise.
  const showError = !!fieldState.error && !(noStorableFolders && !field.value);

  return (
    <StyledField
      label="Folder"
      description="Choose a folder where you want to store the check."
      invalid={showError}
      error={showError ? fieldState.error?.message : undefined}
    >
      <FolderSelector value={field.value} onChange={field.onChange} disabled={disabled} aria-label="Select folder" />
    </StyledField>
  );
}
