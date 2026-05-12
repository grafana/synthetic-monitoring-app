import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, Icon, Pagination, Spinner, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckType, GrafanaFolder, Label } from 'types';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { buildChecksByFolder, collectAllCheckIds, collectAllChecks, collectAllFolderUids, FolderNode, getTotalCheckCount } from 'hooks/useChecksByFolder';
import { Feedback } from 'components/Feedback';
import { CHECKS_PER_PAGE_CARD } from 'page/CheckList/CheckList.constants';
import { CheckListItem } from 'page/CheckList/components/CheckListItem';
import { FolderBulkActions } from 'page/CheckList/components/FolderBulkActions';

interface CheckListFolderViewProps {
  checks: Check[];
  folders: GrafanaFolder[];
  foldersMap: Map<string, GrafanaFolder>;
  foldersLoading?: boolean;
  foldersError?: boolean;
  onRetryFolders?: () => void;
  defaultFolderUid?: string;
  checkAlertStates: CheckRuntimeAlertStates;
  calNames: string[];
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onToggleCheckbox: (checkId: number) => void;
  onSelectChecks: (checkIds: number[]) => void;
  onDeselectChecks: (checkIds: number[]) => void;
  selectedCheckIds: Set<number>;
}

export function CheckListFolderView({
  checks,
  folders,
  foldersMap,
  foldersLoading,
  foldersError,
  onRetryFolders,
  defaultFolderUid,
  checkAlertStates,
  calNames,
  onLabelSelect,
  onStatusSelect,
  onTypeSelect,
  onToggleCheckbox,
  onSelectChecks,
  onDeselectChecks,
  selectedCheckIds,
}: CheckListFolderViewProps) {
  const styles = useStyles2(getStyles);
  const { folderTree, rootChecks } = useMemo(
    () => buildChecksByFolder(checks, folders, defaultFolderUid),
    [checks, folders, defaultFolderUid]
  );

  const defaultFolderNode: FolderNode | null = useMemo(() => {
    if (rootChecks.length === 0) {
      return null;
    }
    const folder = defaultFolderUid ? foldersMap.get(defaultFolderUid) : undefined;
    return {
      folderUid: defaultFolderUid ?? '__default__',
      folder: folder ? { ...folder, title: `${folder.title} (default)` } : undefined,
      folderPath: folder?.title ?? 'Default folder',
      checks: rootChecks,
      children: [],
      isAccessible: !!folder,
      isOrphaned: false,
      isDefault: true,
    };
  }, [rootChecks, defaultFolderUid, foldersMap]);

  const allUids = useMemo(() => {
    const uids = collectAllFolderUids(folderTree);
    if (defaultFolderNode) {
      uids.unshift(defaultFolderNode.folderUid);
    }
    return uids;
  }, [folderTree, defaultFolderNode]);

  // Track collapsed folders rather than expanded ones so that folders
  // arriving from async data (e.g. permission queries) appear expanded
  // by default without overriding folders the user has manually collapsed.
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderUid: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderUid)) {
        next.delete(folderUid);
      } else {
        next.add(folderUid);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedFolders(new Set());
  const collapseAll = () => setCollapsedFolders(new Set(allUids));

  const allExpanded = collapsedFolders.size === 0;
  const allCollapsed = allUids.length > 0 && allUids.every((uid) => collapsedFolders.has(uid));

  const checkItemProps = {
    checkAlertStates,
    calNames,
    foldersLoading,
    foldersError,
    onLabelSelect,
    onStatusSelect,
    onTypeSelect,
    onToggleCheckbox,
    onSelectChecks,
    onDeselectChecks,
    selectedCheckIds,
  };

  const hasAnyContent = folderTree.length > 0 || defaultFolderNode !== null;

  return (
    <div className={styles.container}>
      {hasAnyContent && (
        <div className={styles.foldersSection}>
          <div className={styles.foldersSectionHeader}>
            <h3 className={styles.sectionTitle}>
              Folders ({allUids.length})
              <Feedback feature="folder-view" about={{ text: 'New feature!' }} />
            </h3>
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
              collapsedFolders={collapsedFolders}
              toggleFolder={toggleFolder}
              checkItemProps={checkItemProps}
              onRetryFolders={onRetryFolders}
            />
          ))}

          {defaultFolderNode && (
            <FolderTreeBranch
              key={defaultFolderNode.folderUid}
              node={defaultFolderNode}
              depth={0}
              collapsedFolders={collapsedFolders}
              toggleFolder={toggleFolder}
              checkItemProps={checkItemProps}
              onRetryFolders={onRetryFolders}
            />
          )}
        </div>
      )}

      {!hasAnyContent && (
        <div className={styles.emptyState}>No checks to display</div>
      )}
    </div>
  );
}

interface CheckItemCallbacks {
  checkAlertStates: CheckRuntimeAlertStates;
  calNames: string[];
  foldersLoading?: boolean;
  foldersError?: boolean;
  onLabelSelect: (label: Label) => void;
  onStatusSelect: (enabled: boolean) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onToggleCheckbox: (checkId: number) => void;
  onSelectChecks: (checkIds: number[]) => void;
  onDeselectChecks: (checkIds: number[]) => void;
  selectedCheckIds: Set<number>;
}

interface FolderTreeBranchProps {
  node: FolderNode;
  depth: number;
  collapsedFolders: Set<string>;
  toggleFolder: (uid: string) => void;
  checkItemProps: CheckItemCallbacks;
  onRetryFolders?: () => void;
}

function FolderTreeBranch({ node, depth, collapsedFolders, toggleFolder, checkItemProps, onRetryFolders }: FolderTreeBranchProps) {
  const styles = useStyles2(getStyles);
  const isExpanded = !collapsedFolders.has(node.folderUid);
  const totalChecks = getTotalCheckCount(node);
  const hasContent = node.children.length > 0 || node.checks.length > 0;

  const isRoot = depth === 0;

  const allFolderCheckIds = useMemo(() => collectAllCheckIds(node), [node]);
  const allChecksInFolder = useMemo(() => collectAllChecks(node), [node]);
  const selectedChecksInFolder = useMemo(
    () => allChecksInFolder.filter((c) => checkItemProps.selectedCheckIds.has(c.id!)),
    [allChecksInFolder, checkItemProps.selectedCheckIds]
  );
  const selectedCount = selectedChecksInFolder.length;
  const isAllInFolderSelected = totalChecks > 0 && selectedCount === totalChecks;
  const isSomeInFolderSelected = selectedCount > 0 && !isAllInFolderSelected;

  const handleFolderSelectAll = () => {
    if (isAllInFolderSelected) {
      checkItemProps.onDeselectChecks(allFolderCheckIds);
    } else {
      checkItemProps.onSelectChecks(allFolderCheckIds);
    }
  };

  const handleFolderBulkResolved = () => {
    checkItemProps.onDeselectChecks(allFolderCheckIds);
  };

  return (
    <div className={isRoot ? styles.folderGroup : styles.nestedFolder}>
      <div className={isRoot ? styles.folderHeaderRoot : styles.folderHeaderNested}>
        {totalChecks > 0 && (
          <Checkbox
            aria-label={`Select all checks in ${node.folder?.title ?? 'folder'}`}
            checked={isAllInFolderSelected}
            indeterminate={isSomeInFolderSelected}
            onChange={handleFolderSelectAll}
          />
        )}
        <button
          className={styles.folderToggle}
          onClick={() => toggleFolder(node.folderUid)}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} folder ${node.folder?.title ?? node.folderUid}`}
          type="button"
        >
          <Stack gap={1.5} alignItems="center" wrap="wrap">
            <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="lg" />
            {node.isOrphaned && !checkItemProps.foldersLoading ? (
              <Tooltip content={`Folder UID: ${node.folderUid}`}>
                <Icon name="exclamation-triangle" />
              </Tooltip>
            ) : (
              <Icon name={isExpanded ? 'folder-open' : 'folder'} />
            )}
            <span className={isRoot ? styles.folderTitleRoot : styles.folderTitleNested}>
              {node.isOrphaned && checkItemProps.foldersLoading ? (
                <Spinner size="sm" />
              ) : node.isOrphaned && checkItemProps.foldersError ? (
                'Failed to load folder info'
              ) : node.isOrphaned ? (
                <span className={styles.orphanedLabel}>Folder not found</span>
              ) : (
                node.folder?.title ?? node.folderUid
              )}
            </span>
            {node.isOrphaned && !checkItemProps.foldersLoading && checkItemProps.foldersError && onRetryFolders && (
              <Button
                variant="secondary"
                size="sm"
                icon="sync"
                onClick={(e) => { e.stopPropagation(); onRetryFolders(); }}
                tooltip="Retry loading folders"
              >
                Retry
              </Button>
            )}
            <span className={styles.checkCount}>
              {totalChecks} {totalChecks === 1 ? 'check' : 'checks'}
            </span>
          </Stack>
        </button>
        {selectedCount > 0 && (
          <div className={styles.folderActions}>
            <FolderBulkActions checks={selectedChecksInFolder} onResolved={handleFolderBulkResolved} />
            <span className={styles.selectedCount}>{selectedCount} selected</span>
          </div>
        )}
      </div>

      {isExpanded && hasContent && (
        <div className={isRoot ? styles.folderContentRoot : styles.folderContentNested}>
          {node.children.map((child) => (
            <FolderTreeBranch
              key={child.folderUid}
              node={child}
              depth={depth + 1}
              collapsedFolders={collapsedFolders}
              toggleFolder={toggleFolder}
              checkItemProps={checkItemProps}
              onRetryFolders={onRetryFolders}
            />
          ))}
          {node.checks.length > 0 && (
            <PaginatedCheckList checks={node.checks} checkItemProps={checkItemProps} hideTopPagination={node.isDefault} />
          )}
        </div>
      )}
    </div>
  );
}

interface PaginatedCheckListProps {
  checks: Check[];
  checkItemProps: CheckItemCallbacks;
  hideTopPagination?: boolean;
}

function PaginatedCheckList({ checks, checkItemProps, hideTopPagination }: PaginatedCheckListProps) {
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

  const paginationControls = totalPages > 1 && (
    <div className={styles.pagination}>
      <Pagination numberOfPages={totalPages} currentPage={clampedPage} onNavigate={setCurrentPage} />
    </div>
  );

  return (
    <div className={styles.checkList}>
      {!hideTopPagination && paginationControls}
      {pageChecks.map((check) => (
        <CheckListItem
          key={check.id}
          check={check}
          calNames={checkItemProps.calNames}
          onLabelSelect={checkItemProps.onLabelSelect}
          onStatusSelect={checkItemProps.onStatusSelect}
          onTypeSelect={checkItemProps.onTypeSelect}
          onToggleCheckbox={checkItemProps.onToggleCheckbox}
          runtimeAlertState={getCheckRuntimeAlertState(checkItemProps.checkAlertStates, check)}
          selected={checkItemProps.selectedCheckIds.has(check.id!)}
          viewType={CheckListViewType.Card}
        />
      ))}
      {paginationControls}
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
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.colors.background.secondary,
    gap: theme.spacing(2),
  }),
  folderHeaderNested: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    gap: theme.spacing(2),
  }),
  folderToggle: css({
    appearance: 'none',
    border: 'none',
    background: 'none',
    padding: 0,
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
    userSelect: 'none',
    flex: '1 1 auto',
    minWidth: 0,
    '&:hover': {
      color: theme.colors.text.maxContrast,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.border}`,
      outlineOffset: 2,
      borderRadius: theme.shape.radius.default,
    },
  }),
  folderActions: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexShrink: 0,
  }),
  selectedCount: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),
  folderTitleRoot: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  folderTitleNested: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  orphanedLabel: css({
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  }),
  checkCount: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  folderContentRoot: css({
    padding: theme.spacing(2, 2, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  folderContentNested: css({
    padding: theme.spacing(1.5, 0, 1.5, 3),
    marginLeft: theme.spacing(2),
    borderLeft: `2px solid ${theme.colors.border.medium}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
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
