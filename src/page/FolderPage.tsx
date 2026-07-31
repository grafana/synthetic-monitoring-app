import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { Spinner, TextLink } from '@grafana/ui';

import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useAllFolders } from 'data/useFolders';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
import { buildChecksByFolder, collectAllChecks, FolderNode } from 'hooks/useChecksByFolder';
import { FolderDashboard, FolderPathPart } from 'scenes/Folder/FolderDashboard';

import { PluginPageNotFound } from './NotFound/NotFound';

function findFolderNode(nodes: FolderNode[], uid: string): FolderNode | undefined {
  for (const node of nodes) {
    if (node.folderUid === uid) {
      return node;
    }
    const match = findFolderNode(node.children, uid);
    if (match) {
      return match;
    }
  }
  return undefined;
}

export function FolderPage() {
  const { uid } = useParams<{ uid: string }>();
  const { data: checks = [], isLoading: isLoadingChecks } = useChecks();
  const { folders, foldersMap, defaultFolderUid, isLoading: isLoadingFolders } = useAllFolders();
  const { visibleChecks, externalFolders, isResolving } = useCheckFolderAccess(checks);

  const folderNode = useMemo(() => {
    if (!uid) {
      return undefined;
    }
    const { folderTree } = buildChecksByFolder(visibleChecks, folders, defaultFolderUid, false, externalFolders);
    return findFolderNode(folderTree, uid);
  }, [uid, visibleChecks, folders, defaultFolderUid, externalFolders]);

  const folderChecks = useMemo(() => (folderNode ? collectAllChecks(folderNode) : []), [folderNode]);

  // Ancestor folders link to their own dashboards; the default SM folder links
  // to the checks listing (its "dashboard" is the plugin homepage).
  const pathParts = useMemo((): FolderPathPart[] => {
    if (!folderNode?.folder) {
      return [];
    }
    const parts: FolderPathPart[] = [{ title: folderNode.folder.title }];
    let parentUid = folderNode.folder.parentUid;
    while (parentUid) {
      const parent = foldersMap.get(parentUid);
      if (!parent) {
        break;
      }
      parts.unshift({
        title: parent.title,
        href:
          parent.uid === defaultFolderUid
            ? getRoute(AppRoutes.Checks)
            : generateRoutePath(AppRoutes.FolderDashboard, { uid: parent.uid }),
      });
      parentUid = parent.parentUid;
    }
    return parts;
  }, [folderNode, foldersMap, defaultFolderUid]);

  if (isLoadingChecks || isLoadingFolders || isResolving) {
    return <Spinner />;
  }

  if (!folderNode || folderNode.isOrphaned) {
    return (
      <PluginPageNotFound>
        The folder you are looking for does not exist. Here is a working link to{' '}
        <TextLink href={getRoute(AppRoutes.Checks)}>checks listing</TextLink>.
      </PluginPageNotFound>
    );
  }

  return (
    // Keyed by folder so navigating between folder dashboards remounts:
    // the view-tracking effect fires per folder and the execution-log time
    // window (captured on mount) resets instead of leaking across folders.
    <FolderDashboard
      key={folderNode.folderUid}
      folderTitle={folderNode.folder?.title ?? folderNode.folderUid}
      pathParts={pathParts}
      checks={folderChecks}
    />
  );
}
