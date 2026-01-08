import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolder } from 'data/useFolders';

interface CheckFolderBadgeProps {
  check: Check;
}

export function CheckFolderBadge({ check }: CheckFolderBadgeProps) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folder, isError } = useFolder(check.folderUid, isFoldersEnabled);
  const styles = useStyles2(getStyles);

  if (!isFoldersEnabled || !check.folderUid) {
    return null;
  }

  if (isError || !folder) {
    return (
      <Tag
        name={check.folderUid}
        icon="folder"
        colorIndex={15}
        className={styles.errorTag}
      />
    );
  }

  const handleClick = () => {
    if (folder.url) {
      window.open(folder.url, '_blank');
    }
  };

  return (
    <Tag
      name={folder.title}
      icon="folder"
      onClick={handleClick}
      className={styles.folderTag}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    folderTag: css({
      cursor: 'pointer',
      backgroundColor: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
      borderColor: theme.colors.primary.border,
      '& svg': {
        marginRight: theme.spacing(0.5),
        verticalAlign: 'middle',
      },
    }),
    errorTag: css({
      backgroundColor: theme.colors.warning.main,
      color: theme.colors.warning.contrastText,
      borderColor: theme.colors.warning.border,
      '& svg': {
        marginRight: theme.spacing(0.5),
        verticalAlign: 'middle',
      },
    }),
  };
};

