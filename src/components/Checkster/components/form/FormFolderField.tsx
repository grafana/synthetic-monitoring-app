import React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckFormValues, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { FolderSelector } from 'components/FolderSelector';

export function FormFolderField() {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { control } = useFormContext<CheckFormValues>();
  const { field: folderField } = useController({ control, name: 'folderUid' });

  if (!isFoldersEnabled) {
    return null;
  }

  return <FolderSelector value={folderField.value} onChange={folderField.onChange} includeRoot />;
}
