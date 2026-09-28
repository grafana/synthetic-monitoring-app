import React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { FolderSelector } from 'components/FolderSelector/FolderSelector';

import { StyledField } from '../ui/StyledField';

export function FormFolderField() {
  const { isEnabled: isFoldersEnabled } = useFeatureFlag(FeatureName.Folders);
  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { field, fieldState } = useController({ name: 'folderUid', control });

  if (!isFoldersEnabled) {
    return null;
  }

  return (
    <StyledField
      label="Folder"
      description="Choose a folder where you want to store the check."
      invalid={!!fieldState.error}
      error={fieldState.error?.message}
    >
      <FolderSelector value={field.value} onChange={field.onChange} disabled={disabled} />
    </StyledField>
  );
}
