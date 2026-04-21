import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Tag, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { getFolderPathParts } from 'data/useFolders';

interface CheckFolderBadgeProps {
  check: Check;
  foldersMap: Map<string, GrafanaFolder>;
  foldersLoading?: boolean;
  foldersError?: boolean;
}

export function CheckFolderBadge({ check, foldersMap, foldersLoading, foldersError }: CheckFolderBadgeProps) {
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
    const parts = getFolderPathParts(folder, foldersMap);
    const pathLabel = (parts.length > 1 ? parts.slice(1) : parts).join(' > ');

    return (
      <Tag
        name={pathLabel}
        icon="folder"
        onClick={() => locationService.push(`/dashboards/f/${folder.uid}/`)}
        className={cx(styles.badgeBase, styles.folderTag)}
      />
    );
  }

  return null;
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
});
