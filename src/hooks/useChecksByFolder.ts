import { Check, GrafanaFolder } from 'types';
import { getFolderPath } from 'data/useFolders';

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

/**
 * Build a folder tree from checks and a pre-fetched list of folders.
 *
 * The default folder is treated as an invisible root: its child folders are
 * promoted to top level, and checks assigned to it (or without a folderUid)
 * go into rootChecks.
 */
export function buildChecksByFolder(
  checks: Check[],
  folders: GrafanaFolder[],
  defaultFolderUid?: string
): ChecksByFolder {
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

  const isDefaultFolder = (uid: string | undefined): boolean => !!defaultFolderUid && uid === defaultFolderUid;

  const unassignedChecks: Check[] = [];

  checks.forEach((check) => {
    if (!check.folderUid || isDefaultFolder(check.folderUid)) {
      unassignedChecks.push(check);
      return;
    }
    getOrCreateNode(check.folderUid).checks.push(check);
  });

  nodeMap.forEach((node) => {
    let current = node.folder;
    while (current?.parentUid && !isDefaultFolder(current.parentUid)) {
      getOrCreateNode(current.parentUid);
      current = foldersById.get(current.parentUid);
    }
  });

  const rootNodes: FolderNode[] = [];
  nodeMap.forEach((node) => {
    if (isDefaultFolder(node.folderUid)) {
      return;
    }

    const parentUid = node.folder?.parentUid;
    if (parentUid && !isDefaultFolder(parentUid) && nodeMap.has(parentUid)) {
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

  return { folderTree: rootNodes, rootChecks: unassignedChecks };
}
