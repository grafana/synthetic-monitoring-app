import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from '../CheckList.types';
import { Check, Label } from 'types';
import { useChecksByFolder } from 'hooks/useChecksByFolder';

import { CheckListItem } from './CheckListItem';

interface CheckListFolderViewProps {
  checks: Check[];
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: any) => void;
  onToggleCheckbox: (checkId: number) => void;
  selectedCheckIds: Set<number>;
}

export function CheckListFolderView({
  checks,
  onLabelSelect,
  onStatusSelect,
  onTypeSelect,
  onToggleCheckbox,
  selectedCheckIds,
}: CheckListFolderViewProps) {
  const styles = useStyles2(getStyles);
  const { folderGroups, rootChecks } = useChecksByFolder(checks);
  
  // Track which folders are expanded (default: all expanded)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(folderGroups.map((g) => g.folderUid))
  );

  const toggleFolder = (folderUid: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderUid)) {
        next.delete(folderUid);
      } else {
        next.add(folderUid);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFolders(new Set(folderGroups.map((g) => g.folderUid)));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const allExpanded = expandedFolders.size === folderGroups.length;
  const allCollapsed = expandedFolders.size === 0;

  return (
    <div className={styles.container}>
      {/* Folders Section */}
      {folderGroups.length > 0 && (
        <div className={styles.foldersSection}>
          <div className={styles.foldersSectionHeader}>
            <h3 className={styles.sectionTitle}>Folders ({folderGroups.length})</h3>
            <Stack gap={1}>
              <Button
                variant="secondary"
                size="sm"
                onClick={expandAll}
                disabled={allExpanded}
                icon="angle-down"
                tooltip="Expand all folders"
              >
                Expand all
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={collapseAll}
                disabled={allCollapsed}
                icon="angle-right"
                tooltip="Collapse all folders"
              >
                Collapse all
              </Button>
            </Stack>
          </div>
          {folderGroups.map((group) => {
            const isExpanded = expandedFolders.has(group.folderUid);
            return (
              <div key={group.folderUid} className={styles.folderGroup}>
                <div className={styles.folderHeader} onClick={() => toggleFolder(group.folderUid)}>
                  <Stack gap={1.5} alignItems="center">
                    <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="lg" />
                    <Icon name="folder" />
                    <span className={styles.folderTitle}>
                      {group.folder?.title || group.folderUid}
                      {group.isOrphaned && <span className={styles.orphanedLabel}> (Folder deleted)</span>}
                    </span>
                    <span className={styles.checkCount}>
                      {group.checks.length} {group.checks.length === 1 ? 'check' : 'checks'}
                    </span>
                  </Stack>
                </div>
                {isExpanded && (
                  <div className={styles.folderContent}>
                    {group.checks.map((check) => (
                      <CheckListItem
                        key={check.id}
                        check={check}
                        onLabelSelect={onLabelSelect}
                        onStatusSelect={onStatusSelect}
                        onTypeSelect={onTypeSelect}
                        onToggleCheckbox={onToggleCheckbox}
                        selected={selectedCheckIds.has(check.id!)}
                        viewType={CheckListViewType.Card}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Root Checks Section */}
      {rootChecks.length > 0 && (
        <div className={styles.rootSection}>
          <div className={styles.foldersSectionHeader}>
            <h3 className={styles.sectionTitle}>Root Level ({rootChecks.length})</h3>
          </div>
          <div className={styles.rootChecks}>
            {rootChecks.map((check) => (
              <CheckListItem
                key={check.id}
                check={check}
                onLabelSelect={onLabelSelect}
                onStatusSelect={onStatusSelect}
                onTypeSelect={onTypeSelect}
                onToggleCheckbox={onToggleCheckbox}
                selected={selectedCheckIds.has(check.id!)}
                viewType={CheckListViewType.Card}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {folderGroups.length === 0 && rootChecks.length === 0 && (
        <div className={styles.emptyState}>No checks to display</div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '100%',
  }),
  foldersSection: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  foldersSectionHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  }),
  sectionTitle: css({
    margin: 0,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  folderGroup: css({
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
    '&:hover': {
      boxShadow: theme.shadows.z2,
    },
  }),
  folderHeader: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
    },
    '&:active': {
      backgroundColor: theme.colors.emphasize(theme.colors.background.secondary, 0.05),
    },
  }),
  folderTitle: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.h5.fontSize,
    flex: 1,
  }),
  checkCount: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.shape.radius.default,
  }),
  orphanedLabel: css({
    color: theme.colors.warning.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
  }),
  folderContent: css({
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    backgroundColor: theme.colors.background.primary,
  }),
  rootSection: css({
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
  }),
  rootChecks: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  emptyState: css({
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.colors.text.secondary,
  }),
});

