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
  isDefault?: boolean;
  /** Folder exists and is readable but lives outside the default folder's subtree. */
  isExternal?: boolean;
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

export function collectAllCheckIds(node: FolderNode): number[] {
  const ids = node.checks.map((c) => c.id!);
  node.children.forEach((child) => {
    ids.push(...collectAllCheckIds(child));
  });
  return ids;
}

export function collectAllChecks(node: FolderNode): Check[] {
  const checks = [...node.checks];
  node.children.forEach((child) => {
    checks.push(...collectAllChecks(child));
  });
  return checks;
}

/**
 * Build a folder tree from checks and a pre-fetched list of folders.
 *
 * The default folder is treated as an invisible root: its child folders are
 * promoted to top level, and checks assigned to it (or without a folderUid)
 * go into rootChecks.
 *
 * `externalFolders` are readable folders outside the default folder's subtree
 * that have checks assigned to them (e.g. via the API, or stranded by a
 * default-folder UID mismatch). They only get a node when a check references
 * them, rendered at top level and flagged with `isExternal`.
 */
export function buildChecksByFolder(
  checks: Check[],
  folders: GrafanaFolder[],
  defaultFolderUid?: string,
  reverseFolderSort?: boolean,
  externalFolders: GrafanaFolder[] = []
): ChecksByFolder {
  const foldersById = new Map([...folders, ...externalFolders].map((f) => [f.uid, f]));
  const externalUids = new Set(externalFolders.map((f) => f.uid));
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
        isExternal: externalUids.has(uid),
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

  folders.forEach((folder) => {
    if (!isDefaultFolder(folder.uid)) {
      getOrCreateNode(folder.uid);
    }
  });

  nodeMap.forEach((node) => {
    // External folders stay at top level: their ancestors are not part of the
    // SM folder data, so walking up would create bogus "not found" nodes.
    if (node.isExternal) {
      return;
    }
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

  const sortByTitle = (a: FolderNode, b: FolderNode) => {
    const titleA = a.folder?.title ?? a.folderUid;
    const titleB = b.folder?.title ?? b.folderUid;
    const result = titleA.localeCompare(titleB);
    return reverseFolderSort ? -result : result;
  };

  const sortNodes = (nodes: FolderNode[]) => {
    const withChecks = nodes.filter((n) => getTotalCheckCount(n) > 0).sort(sortByTitle);
    const empty = nodes.filter((n) => getTotalCheckCount(n) === 0).sort(sortByTitle);

    nodes.length = 0;
    nodes.push(...withChecks, ...empty);

    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(rootNodes);

  return { folderTree: rootNodes, rootChecks: unassignedChecks };
}
