import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Tag, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { getFolderPath } from 'data/useFolders';

interface CheckFolderBadgeProps {
  check: Check;
  foldersMap: Map<string, GrafanaFolder>;
  foldersLoading?: boolean;
}

export function CheckFolderBadge({ check, foldersMap, foldersLoading }: CheckFolderBadgeProps) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const styles = useStyles2(getStyles);

  if (!isFoldersEnabled || !check.folderUid) {
    return null;
  }

  if (foldersLoading) {
    return null;
  }

  const folder = foldersMap.get(check.folderUid);

  if (folder) {
    const fullPath = getFolderPath(folder, foldersMap);
    const pathLabel = fullPath.includes(' > ') ? fullPath.split(' > ').slice(1).join(' > ') : fullPath;

    return (
      <Tag
        name={pathLabel}
        icon="folder"
        onClick={() => locationService.push(`/dashboards/f/${folder.uid}/`)}
        className={cx(styles.badgeBase, styles.folderTag)}
      />
    );
  }

  return (
    <Tooltip content={`Folder no longer exists: ${check.folderUid}`}>
      <Tag name="Folder deleted" icon="folder" colorIndex={15} className={cx(styles.badgeBase, styles.errorTag)} />
    </Tooltip>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  badgeBase: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    '& svg': {
      verticalAlign: 'middle',
    },
  }),
  folderTag: css({
    cursor: 'pointer',
  }),
  errorTag: css({
    backgroundColor: theme.colors.warning.main,
    color: theme.colors.warning.contrastText,
    borderColor: theme.colors.warning.border,
  }),
});
