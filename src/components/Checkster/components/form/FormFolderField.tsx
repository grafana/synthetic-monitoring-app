import React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';

import { StyledField } from '../ui/StyledField';

export function FormFolderField() {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { control, formState: { disabled } } = useFormContext<CheckFormValues>();
  const { field } = useController({ name: 'folderUid', control });

  if (!isFoldersEnabled) {
    return null;
  }

  return (
    <StyledField label="Folder" description="Choose a folder where you want to store the check.">
      <FolderSelector
        value={field.value}
        onChange={field.onChange}
        disabled={disabled}
        aria-label="Select folder"
      />
    </StyledField>
  );
}
