import React from 'react';
import { Badge } from '@grafana/ui';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolder } from 'data/useFolders';

interface CheckFolderBadgeProps {
  check: Check;
}

export function CheckFolderBadge({ check }: CheckFolderBadgeProps) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folder, isError } = useFolder(check.folderUid, isFoldersEnabled);

  if (!isFoldersEnabled || !check.folderUid) {
    return null;
  }

  if (isError || !folder) {
    return (
      <Badge
        text={check.folderUid}
        color="orange"
        icon="folder"
        tooltip={`Folder not found (${check.folderUid})`}
      />
    );
  }

  return (
    <Badge
      text={folder.title}
      color="blue"
      icon="folder"
      tooltip={`This check is in the "${folder.title}" folder`}
    />
  );
}

