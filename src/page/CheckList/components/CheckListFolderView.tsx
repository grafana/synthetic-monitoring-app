import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from '../CheckList.types';
import { Check, Label } from 'types';
import {
  collectAllFolderUids,
  FolderNode,
  getTotalCheckCount,
  useChecksByFolder,
} from 'hooks/useChecksByFolder';

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
  const { folderTree, rootChecks } = useChecksByFolder(checks);

  const allUids = collectAllFolderUids(folderTree);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(allUids));

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

  const expandAll = () => setExpandedFolders(new Set(allUids));
  const collapseAll = () => setExpandedFolders(new Set());

  const allExpanded = expandedFolders.size === allUids.length && allUids.length > 0;
  const allCollapsed = expandedFolders.size === 0;

  const checkItemProps = {
    onLabelSelect,
    onStatusSelect,
    onTypeSelect,
    onToggleCheckbox,
    selectedCheckIds,
  };

  return (
    <div className={styles.container}>
      {folderTree.length > 0 && (
        <div className={styles.foldersSection}>
          <div className={styles.foldersSectionHeader}>
            <h3 className={styles.sectionTitle}>Folders ({allUids.length})</h3>
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

          {folderTree.map((node) => (
            <FolderTreeBranch
              key={node.folderUid}
              node={node}
              depth={0}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              checkItemProps={checkItemProps}
            />
          ))}
        </div>
      )}

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

      {folderTree.length === 0 && rootChecks.length === 0 && (
        <div className={styles.emptyState}>No checks to display</div>
      )}
    </div>
  );
}

interface CheckItemCallbacks {
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: any) => void;
  onToggleCheckbox: (checkId: number) => void;
  selectedCheckIds: Set<number>;
}

interface FolderTreeBranchProps {
  node: FolderNode;
  depth: number;
  expandedFolders: Set<string>;
  toggleFolder: (uid: string) => void;
  checkItemProps: CheckItemCallbacks;
}

function FolderTreeBranch({ node, depth, expandedFolders, toggleFolder, checkItemProps }: FolderTreeBranchProps) {
  const styles = useStyles2(getStyles);
  const isExpanded = expandedFolders.has(node.folderUid);
  const totalChecks = getTotalCheckCount(node);
  const hasContent = node.children.length > 0 || node.checks.length > 0;

  const isRoot = depth === 0;

  return (
    <div className={isRoot ? styles.folderGroup : styles.nestedFolder}>
      <div
        className={isRoot ? styles.folderHeaderRoot : styles.folderHeaderNested}
        onClick={() => toggleFolder(node.folderUid)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFolder(node.folderUid);
          }
        }}
      >
        <Stack gap={1.5} alignItems="center">
          <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="lg" />
          <Icon name={isExpanded ? 'folder-open' : 'folder'} />
          <span className={isRoot ? styles.folderTitleRoot : styles.folderTitleNested}>
            {node.folder?.title ?? node.folderUid}
            {node.isOrphaned && <span className={styles.orphanedLabel}> (Folder deleted)</span>}
          </span>
          <span className={styles.checkCount}>
            {totalChecks} {totalChecks === 1 ? 'check' : 'checks'}
          </span>
        </Stack>
      </div>

      {isExpanded && hasContent && (
        <div className={isRoot ? styles.folderContentRoot : styles.folderContentNested}>
          {node.children.map((child) => (
            <FolderTreeBranch
              key={child.folderUid}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              checkItemProps={checkItemProps}
            />
          ))}

          {node.checks.map((check) => (
            <CheckListItem
              key={check.id}
              check={check}
              onLabelSelect={checkItemProps.onLabelSelect}
              onStatusSelect={checkItemProps.onStatusSelect}
              onTypeSelect={checkItemProps.onTypeSelect}
              onToggleCheckbox={checkItemProps.onToggleCheckbox}
              selected={checkItemProps.selectedCheckIds.has(check.id!)}
              viewType={CheckListViewType.Card}
            />
          ))}
        </div>
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
  }),
  nestedFolder: css({
    marginTop: theme.spacing(0.5),
  }),
  folderHeaderRoot: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.colors.background.secondary,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
    },
  }),
  folderHeaderNested: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 1.5),
    cursor: 'pointer',
    userSelect: 'none',
    borderRadius: theme.shape.radius.default,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.emphasize(theme.colors.background.primary, 0.03),
    },
  }),
  folderTitleRoot: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.h5.fontSize,
    flex: 1,
  }),
  folderTitleNested: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
    flex: 1,
    color: theme.colors.text.secondary,
  }),
  checkCount: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  orphanedLabel: css({
    color: theme.colors.warning.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
  }),
  folderContentRoot: css({
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  folderContentNested: css({
    paddingLeft: theme.spacing(3),
    borderLeft: `1px solid ${theme.colors.border.weak}`,
    marginLeft: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
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

