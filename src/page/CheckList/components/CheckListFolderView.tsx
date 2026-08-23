import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Checkbox,
  ConfirmModal,
  Icon,
  IconButton,
  Pagination,
  Spinner,
  Stack,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckSort, CheckType, GrafanaFolder, Label } from 'types';
import { useCheckFolderStatus } from 'contexts/CheckFolderAccessContext';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { useDeleteFolder } from 'data/useFolders';
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
import { FolderBulkActions } from 'page/CheckList/components/FolderBulkActions';
import { MoveFolderModal } from 'page/CheckList/components/MoveFolderModal';

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
  const folderCanDelete = folderStatus.type === 'accessible' && folderStatus.permissions.canDelete;
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

  // Folders outside the SM subtree may hold unrelated content (dashboards,
  // subfolders, alert rules), so we never offer to delete them from SM --
  // moving checks out (or moving the folder) is the supported operation.
  const deleteFolderTarget =
    isAllInFolderSelected && folderCanDelete && !node.isDefault && !node.isOrphaned && !node.isOutside
      ? { uid: node.folderUid, title: node.folder?.title ?? node.folderUid }
      : undefined;

  const isEmpty = totalChecks === 0;
  const canDeleteEmptyFolder = isEmpty && folderCanDelete && !node.isDefault && !node.isOrphaned && !node.isOutside;

  // Any editable folder can be moved anywhere in the Grafana folder tree
  // (destinations picked with Grafana's folder picker). Orphaned folders are
  // not movable here.
  const canMoveFolder = folderCanEdit && !node.isDefault && !node.isOrphaned && !!node.folder;
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [emptyFolderSelected, setEmptyFolderSelected] = useState(false);
  const [showDeleteEmptyFolderModal, setShowDeleteEmptyFolderModal] = useState(false);
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();

  // Like folder delete, the move action only appears once the folder is
  // selected: all of its checks for regular folders, or the empty-folder
  // checkbox for empty ones.
  const showMoveAction = canMoveFolder && (isEmpty ? emptyFolderSelected : isAllInFolderSelected);

  const handleDeleteEmptyFolder = async () => {
    try {
      await deleteFolderAsync(node.folderUid);
    } catch {
      // Folder deletion failed — modal closes, folder stays visible
    }
    setShowDeleteEmptyFolderModal(false);
    setEmptyFolderSelected(false);
  };

  const handleFolderSelectAll = () => {
    if (isEmpty) {
      setEmptyFolderSelected((prev) => !prev);
      return;
    }
    if (isAllInFolderSelected) {
      checkItemProps.onDeselectChecks(allFolderCheckIds);
    } else {
      checkItemProps.onSelectChecks(allFolderCheckIds);
    }
  };

  const handleFolderBulkResolved = () => {
    checkItemProps.onDeselectChecks(allFolderCheckIds);
  };

  const showActions = isEmpty ? emptyFolderSelected : hasDirectSelection;

  return (
    <div className={isRoot ? styles.folderGroup : styles.nestedFolder}>
      <div className={isRoot ? styles.folderHeaderRoot : styles.folderHeaderNested}>
        <Checkbox
          aria-label={
            isEmpty ? `Select folder ${displayTitle ?? 'folder'}` : `Select all checks in ${displayTitle ?? 'folder'}`
          }
          checked={isEmpty ? emptyFolderSelected : isAllInFolderSelected}
          indeterminate={!isEmpty && isSomeInFolderSelected}
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
        {showMoveModal && node.folder && (
          <MoveFolderModal folder={node.folder} onDismiss={() => setShowMoveModal(false)} />
        )}
        {showActions && !isEmpty && (
          <div className={styles.folderActions}>
            {showMoveAction && (
              <IconButton
                name="folder-upload"
                // IconButton uses the tooltip as the accessible name, so it
                // includes the title to keep names unique across folder rows.
                tooltip={`Move folder ${node.folder?.title ?? node.folderUid}`}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveModal(true);
                }}
              />
            )}
            <FolderBulkActions
              checks={selectedChecksInFolder}
              onResolved={handleFolderBulkResolved}
              deleteFolder={deleteFolderTarget}
            />
            <span className={styles.selectedCount}>{selectedCount} selected</span>
          </div>
        )}
        {showActions && isEmpty && (canDeleteEmptyFolder || showMoveAction) && (
          <div className={styles.folderActions}>
            {showMoveAction && (
              <IconButton
                name="folder-upload"
                tooltip={`Move folder ${node.folder?.title ?? node.folderUid}`}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveModal(true);
                }}
              />
            )}
            {canDeleteEmptyFolder && (
              <IconButton
                name="trash-alt"
                aria-label="Delete folder"
                tooltip="Delete folder"
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteEmptyFolderModal(true);
                }}
              />
            )}
            <span className={styles.selectedCount}>1 selected</span>
            {showDeleteEmptyFolderModal && (
              <ConfirmModal
                isOpen={showDeleteEmptyFolderModal}
                title={`Delete folder "${node.folder?.title ?? node.folderUid}"`}
                body="This will delete the empty folder. This action cannot be undone."
                confirmText="Delete folder"
                onConfirm={handleDeleteEmptyFolder}
                onDismiss={() => setShowDeleteEmptyFolderModal(false)}
              />
            )}
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
