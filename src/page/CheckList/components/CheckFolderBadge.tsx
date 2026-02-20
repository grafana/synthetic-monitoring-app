import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { getFolderPath, useFolder } from 'data/useFolders';

interface CheckFolderBadgeProps {
  check: Check;
}

export function CheckFolderBadge({ check }: CheckFolderBadgeProps) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const folderInfo = useFolder(check.folderUid, isFoldersEnabled);
  const styles = useStyles2(getStyles);

  if (!isFoldersEnabled || !check.folderUid) {
    return null;
  }

  // Loading state
  if (folderInfo.isLoading) {
    return null;
  }

  // Folder exists and accessible (200)
  if (folderInfo.hasAccess && folderInfo.folder) {
    const handleClick = () => {
      if (folderInfo.folder?.url) {
        window.open(folderInfo.folder.url, '_blank');
      }
    };

    const pathLabel = getFolderPath(folderInfo.folder);

    return <Tag name={pathLabel} icon="folder" onClick={handleClick} className={styles.folderTag} />;
  }

  // Folder deleted/orphaned (404) or any error - assume deleted for better UX
  return (
    <Tooltip content={`Folder no longer exists: ${check.folderUid}`}>
      <Tag name="Folder deleted" icon="folder" colorIndex={15} className={styles.errorTag} />
    </Tooltip>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    folderTag: css({
      cursor: 'pointer',
      backgroundColor: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
      borderColor: theme.colors.primary.border,
      display: 'inline-flex',
      alignItems: 'center',
      '& svg': {
        marginRight: theme.spacing(0.5),
      },
    }),
    errorTag: css({
      backgroundColor: theme.colors.warning.main,
      color: theme.colors.warning.contrastText,
      borderColor: theme.colors.warning.border,
      display: 'inline-flex',
      alignItems: 'center',
      '& svg': {
        marginRight: theme.spacing(0.5),
      },
    }),
  };
};

