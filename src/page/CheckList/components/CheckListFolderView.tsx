import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, Icon, Pagination, Spinner, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckSort, CheckType, GrafanaFolder, Label } from 'types';
import { useCheckFolderStatus } from 'contexts/CheckFolderAccessContext';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';
import {
  buildChecksByFolder,
  collectAllCheckIds,
  collectAllChecks,
  collectAllFolderUids,
  FolderNode,
  getTotalCheckCount,
} from 'hooks/useChecksByFolder';
import { Feedback } from 'components/Feedback';
import { CHECKS_PER_PAGE_CARD } from 'page/CheckList/CheckList.constants';
import { CheckListItem } from 'page/CheckList/components/CheckListItem';
import { FolderActionsMenu } from 'page/CheckList/components/FolderActionsMenu';
import { FolderBulkActions } from 'page/CheckList/components/FolderBulkActions';

interface CheckListFolderViewProps {
  checks: Check[];
  folders: GrafanaFolder[];
  outsideFolders?: GrafanaFolder[];
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
  sortType: CheckSort;
}

export function CheckListFolderView({
  checks,
  folders,
  outsideFolders,
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
  sortType,
}: CheckListFolderViewProps) {
  const styles = useStyles2(getStyles);
  const reverseFolderSort = sortType === CheckSort.ZToA;
  const { folderTree } = useMemo(
    () => buildChecksByFolder(checks, folders, defaultFolderUid, reverseFolderSort, outsideFolders),
    [checks, folders, defaultFolderUid, reverseFolderSort, outsideFolders]
  );

  const allUids = useMemo(() => collectAllFolderUids(folderTree), [folderTree]);

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

  // Same pattern as Alerting → Notification policies: one button that flips
  // between expand-all and collapse-all based on whether everything is open.
  // Only folders currently in the tree count: collapsedFolders can hold
  // stale UIDs of folders that have since left it (filters, deletions).
  const allExpanded = allUids.every((uid) => !collapsedFolders.has(uid));

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setCollapsedFolders(new Set(allUids));
    } else {
      setCollapsedFolders(new Set());
    }
  };

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

  const hasAnyContent = folderTree.length > 0;

  return (
    <div className={styles.container}>
      {hasAnyContent && (
        <div className={styles.foldersSection}>
          <div className={styles.foldersSectionHeader}>
            <h3 className={styles.sectionTitle}>
              Folders ({allUids.length})
              <Feedback feature="folder-view" about={{ text: 'New feature!' }} />
            </h3>
            <Button
              variant="secondary"
              icon={allExpanded ? 'table-collapse-all' : 'table-expand-all'}
              onClick={toggleAllExpanded}
              aria-label={allExpanded ? 'Collapse all folders' : 'Expand all folders'}
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Button>
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
        </div>
      )}

      {!hasAnyContent && <div className={styles.emptyState}>No checks to display</div>}
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

function FolderTreeBranch({
  node,
  depth,
  collapsedFolders,
  toggleFolder,
  checkItemProps,
  onRetryFolders,
}: FolderTreeBranchProps) {
  const styles = useStyles2(getStyles);
  const isExpanded = !collapsedFolders.has(node.folderUid);
  const totalChecks = getTotalCheckCount(node);
  const hasContent = node.children.length > 0 || node.checks.length > 0;

  const isRoot = depth === 0;

  const folderStatus = useCheckFolderStatus({ folderUid: node.folderUid });
  const folderCanEdit = folderStatus.type === 'accessible' && folderStatus.permissions.canEdit;

  const allFolderCheckIds = useMemo(() => collectAllCheckIds(node), [node]);
  const allChecksInFolder = useMemo(() => collectAllChecks(node), [node]);
  const selectedChecksInFolder = useMemo(
    () => allChecksInFolder.filter((c) => checkItemProps.selectedCheckIds.has(c.id!)),
    [allChecksInFolder, checkItemProps.selectedCheckIds]
  );
  const selectedCount = selectedChecksInFolder.length;
  const isAllInFolderSelected = totalChecks > 0 && selectedCount === totalChecks;
  const isSomeInFolderSelected = selectedCount > 0 && !isAllInFolderSelected;
  // The inline action row belongs to the folder whose own checks are
  // selected. Ancestors reflect descendant selections through their
  // (indeterminate) checkbox only — repeating the action row at every
  // level would just duplicate it.
  const hasDirectSelection = node.checks.some((c) => checkItemProps.selectedCheckIds.has(c.id!));

  const displayTitle = node.isDefault ? `${node.folder?.title ?? node.folderUid} (default)` : node.folder?.title;

  // Any editable folder can be moved anywhere in the Grafana folder tree
  // (destinations picked with Grafana's folder picker). Orphaned folders are
  // not movable here.
  const canMoveFolder = folderCanEdit && !node.isDefault && !node.isOrphaned && !!node.folder;

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

  const showActions = hasDirectSelection;

  return (
    <div className={isRoot ? styles.folderGroup : styles.nestedFolder}>
      <div className={isRoot ? styles.folderHeaderRoot : styles.folderHeaderNested}>
        <Checkbox
          aria-label={`Select all checks in ${displayTitle ?? 'folder'}`}
          checked={isAllInFolderSelected}
          indeterminate={isSomeInFolderSelected}
          onChange={handleFolderSelectAll}
        />
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
                (displayTitle ?? node.folderUid)
              )}
            </span>
            {node.isOrphaned && !checkItemProps.foldersLoading && checkItemProps.foldersError && onRetryFolders && (
              <Button
                variant="secondary"
                size="sm"
                icon="sync"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetryFolders();
                }}
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
        {showActions && (
          <div className={styles.folderActions}>
            <FolderBulkActions checks={selectedChecksInFolder} onResolved={handleFolderBulkResolved} />
            <span className={styles.selectedCount}>{selectedCount} selected</span>
          </div>
        )}
        <FolderActionsMenu
          folderTitle={displayTitle ?? node.folderUid}
          checks={allChecksInFolder}
          onResolved={handleFolderBulkResolved}
          moveFolder={canMoveFolder ? node.folder : undefined}
        />
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
            <PaginatedCheckList
              checks={node.checks}
              checkItemProps={checkItemProps}
              hideTopPagination={node.isDefault}
            />
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

  const pageChecks = checks.slice((clampedPage - 1) * CHECKS_PER_PAGE_CARD, clampedPage * CHECKS_PER_PAGE_CARD);

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
