import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Pagination, Spinner, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckType, GrafanaFolder, Label } from 'types';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { buildChecksByFolder, collectAllFolderUids, FolderNode, getTotalCheckCount } from 'hooks/useChecksByFolder';
import { CHECKS_PER_PAGE_CARD } from 'page/CheckList/CheckList.constants';
import { CheckListItem } from 'page/CheckList/components/CheckListItem';

interface CheckListFolderViewProps {
  checks: Check[];
  folders: GrafanaFolder[];
  foldersMap: Map<string, GrafanaFolder>;
  foldersLoading?: boolean;
  defaultFolderUid?: string;
  checkAlertStates: CheckRuntimeAlertStates;
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onToggleCheckbox: (checkId: number) => void;
  selectedCheckIds: Set<number>;
}

export function CheckListFolderView({
  checks,
  folders,
  foldersMap,
  foldersLoading,
  defaultFolderUid,
  checkAlertStates,
  onLabelSelect,
  onStatusSelect,
  onTypeSelect,
  onToggleCheckbox,
  selectedCheckIds,
}: CheckListFolderViewProps) {
  const styles = useStyles2(getStyles);
  const { folderTree, rootChecks } = useMemo(
    () => buildChecksByFolder(checks, folders, defaultFolderUid),
    [checks, folders, defaultFolderUid]
  );

  const allUids = useMemo(() => collectAllFolderUids(folderTree), [folderTree]);

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

  const allExpanded = allUids.length > 0 && allUids.every((uid) => expandedFolders.has(uid));
  const allCollapsed = expandedFolders.size === 0;

  const checkItemProps = {
    checkAlertStates,
    foldersMap,
    foldersLoading,
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
            <h3 className={styles.sectionTitle}>
              Unassigned ({rootChecks.length})
              <Tooltip content="Checks in the default Synthetic Monitoring folder">
                <Icon name="info-circle" size="sm" className={styles.sectionInfoIcon} />
              </Tooltip>
            </h3>
          </div>
          <PaginatedCheckList checks={rootChecks} checkItemProps={checkItemProps} />
        </div>
      )}

      {folderTree.length === 0 && rootChecks.length === 0 && (
        <div className={styles.emptyState}>No checks to display</div>
      )}
    </div>
  );
}

interface CheckItemCallbacks {
  checkAlertStates: CheckRuntimeAlertStates;
  foldersMap: Map<string, GrafanaFolder>;
  foldersLoading?: boolean;
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: CheckType) => void;
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
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} folder ${node.folder?.title ?? node.folderUid}`}
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
            {node.isOrphaned && checkItemProps.foldersLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                {node.folder?.title ?? node.folderUid}
                {node.isOrphaned && !checkItemProps.foldersLoading && (
                  <span className={styles.orphanedLabel}> (Folder deleted)</span>
                )}
              </>
            )}
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
          {node.checks.length > 0 && (
            <PaginatedCheckList checks={node.checks} checkItemProps={checkItemProps} />
          )}
        </div>
      )}
    </div>
  );
}

interface PaginatedCheckListProps {
  checks: Check[];
  checkItemProps: CheckItemCallbacks;
}

function PaginatedCheckList({ checks, checkItemProps }: PaginatedCheckListProps) {
  const styles = useStyles2(getStyles);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(checks.length / CHECKS_PER_PAGE_CARD);
  const clampedPage = Math.min(currentPage, Math.max(1, totalPages));

  useEffect(() => {
    if (currentPage !== clampedPage) {
      setCurrentPage(clampedPage);
    }
  }, [currentPage, clampedPage]);

  const pageChecks = checks.slice(
    (clampedPage - 1) * CHECKS_PER_PAGE_CARD,
    clampedPage * CHECKS_PER_PAGE_CARD
  );

  return (
    <div className={styles.checkList}>
      {pageChecks.map((check) => (
        <CheckListItem
          key={check.id}
          check={check}
          foldersMap={checkItemProps.foldersMap}
          foldersLoading={checkItemProps.foldersLoading}
          onLabelSelect={checkItemProps.onLabelSelect}
          onStatusSelect={checkItemProps.onStatusSelect}
          onTypeSelect={checkItemProps.onTypeSelect}
          onToggleCheckbox={checkItemProps.onToggleCheckbox}
          runtimeAlertState={getCheckRuntimeAlertState(checkItemProps.checkAlertStates, check)}
          selected={checkItemProps.selectedCheckIds.has(check.id!)}
          viewType={CheckListViewType.Card}
        />
      ))}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination numberOfPages={totalPages} currentPage={clampedPage} onNavigate={setCurrentPage} />
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
  }),
  foldersSection: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  rootSection: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  foldersSectionHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  sectionTitle: css({
    margin: 0,
    fontSize: theme.typography.h5.fontSize,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  sectionInfoIcon: css({
    color: theme.colors.text.secondary,
    cursor: 'help',
  }),
  folderGroup: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  nestedFolder: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
  folderHeaderRoot: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.colors.background.secondary,
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
  }),
  folderHeaderNested: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
  }),
  folderTitleRoot: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  folderTitleNested: css({
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  orphanedLabel: css({
    color: theme.colors.warning.text,
    fontStyle: 'italic',
  }),
  checkCount: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  folderContentRoot: css({
    padding: theme.spacing(1, 2, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  folderContentNested: css({
    paddingLeft: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  checkList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  pagination: css({
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  emptyState: css({
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.colors.text.secondary,
  }),
});
