import { useMemo } from 'react';

import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { getFolderPath, useFolders } from 'data/useFolders';

export interface FolderNode {
  folderUid: string;
  folder?: GrafanaFolder;
  folderPath: string;
  checks: Check[];
  children: FolderNode[];
  isAccessible: boolean;
  isOrphaned: boolean;
}

export interface ChecksByFolder {
  folderTree: FolderNode[];
  rootChecks: Check[];
}

export function collectAllFolderUids(nodes: FolderNode[]): string[] {
  const uids: string[] = [];
  const walk = (list: FolderNode[]) => {
    list.forEach((node) => {
      uids.push(node.folderUid);
      walk(node.children);
    });
  };
  walk(nodes);
  return uids;
}

export function getTotalCheckCount(node: FolderNode): number {
  let count = node.checks.length;
  node.children.forEach((child) => {
    count += getTotalCheckCount(child);
  });
  return count;
}

export function useChecksByFolder(checks: Check[]): ChecksByFolder {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders = [] } = useFolders();

  return useMemo(() => {
    if (!isFoldersEnabled) {
      return { folderTree: [], rootChecks: checks };
    }

    const rootChecks: Check[] = [];
    const foldersById = new Map(folders.map((f) => [f.uid, f]));
    const nodeMap = new Map<string, FolderNode>();

    const getOrCreateNode = (uid: string): FolderNode => {
      if (!nodeMap.has(uid)) {
        const folder = foldersById.get(uid);
        nodeMap.set(uid, {
          folderUid: uid,
          folder,
          folderPath: folder ? getFolderPath(folder, foldersById) : uid,
          checks: [],
          children: [],
          isAccessible: !!folder,
          isOrphaned: !folder,
        });
      }
      return nodeMap.get(uid)!;
    };

    checks.forEach((check) => {
      if (!check.folderUid) {
        rootChecks.push(check);
        return;
      }
      getOrCreateNode(check.folderUid).checks.push(check);
    });

    // Ensure ancestor folders exist as nodes so the tree is connected
    nodeMap.forEach((node) => {
      let current = node.folder;
      while (current?.parentUid) {
        getOrCreateNode(current.parentUid);
        current = foldersById.get(current.parentUid);
      }
    });

    // Build the tree by linking children to parents
    const rootNodes: FolderNode[] = [];
    nodeMap.forEach((node) => {
      const parentUid = node.folder?.parentUid;
      if (parentUid && nodeMap.has(parentUid)) {
        nodeMap.get(parentUid)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => {
        const titleA = a.folder?.title ?? a.folderUid;
        const titleB = b.folder?.title ?? b.folderUid;
        return titleA.localeCompare(titleB);
      });
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    return { folderTree: rootNodes, rootChecks };
  }, [checks, folders, isFoldersEnabled]);
}

