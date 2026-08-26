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
  /** Folder exists and is readable but lives outside the default folder's subtree (root level, team folder, ...). */
  isOutside?: boolean;
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
 * The tree mirrors Grafana's real folder hierarchy: the default folder is an
 * ordinary (pinned-first) top-level node whose subtree nests inside it, and
 * folders outside it render at top level or under their own parents. Checks
 * without a folderUid effectively live in the default folder, so they land
 * in its node; they only fall back to `rootChecks` when no default folder is
 * known.
 *
 * One rule, no exceptions: a folder only appears when it (or a descendant)
 * contains a check. Empty folders — including the default folder and empty
 * SM subfolders — are never shown; folder management for them lives in
 * Dashboards > Folders. Ancestors of check-bearing folders are kept so
 * nesting stays intact.
 *
 * `outsideFolders` are readable folders outside the default folder's subtree
 * (at the Grafana root level, inside a team folder, etc.) — first-class
 * locations under open folder assignment. They nest under their parent when
 * it is known (i.e. it also has a node); unknown ancestors do not create
 * bogus nodes, the folder simply renders at top level.
 */
export function buildChecksByFolder(
  checks: Check[],
  folders: GrafanaFolder[],
  defaultFolderUid?: string,
  reverseFolderSort?: boolean,
  outsideFolders: GrafanaFolder[] = []
): ChecksByFolder {
  const foldersById = new Map([...folders, ...outsideFolders].map((f) => [f.uid, f]));
  const outsideUids = new Set(outsideFolders.map((f) => f.uid));
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
        isDefault: uid === defaultFolderUid,
        isOutside: outsideUids.has(uid),
      });
    }
    return nodeMap.get(uid)!;
  };

  const rootChecks: Check[] = [];

  // Nodes are only created for folders that hold checks; ancestors are
  // materialized below so nesting stays intact. Every node therefore has at
  // least one check somewhere beneath it — empty folders never render.
  checks.forEach((check) => {
    // `||` (not `??`): an empty-string folderUid also means the default folder.
    const folderUid = check.folderUid || defaultFolderUid;
    if (!folderUid) {
      rootChecks.push(check);
      return;
    }
    getOrCreateNode(folderUid).checks.push(check);
  });

  nodeMap.forEach((node) => {
    // Materialize known ancestors so nesting works. Ancestors we have no
    // folder data for (e.g. an outside folder's parent that no check
    // references) are skipped instead of creating bogus "not found" nodes;
    // the node then renders at top level.
    let current = node.folder;
    while (current?.parentUid) {
      const parent = foldersById.get(current.parentUid);
      if (!parent) {
        break;
      }
      getOrCreateNode(parent.uid);
      current = parent;
    }
  });

  const rootNodes: FolderNode[] = [];
  nodeMap.forEach((node) => {
    const parentUid = node.folder?.parentUid;
    if (parentUid && nodeMap.has(parentUid)) {
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
    nodes.sort(sortByTitle);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(rootNodes);

  // The default folder leads the list regardless of check counts.
  const defaultIndex = rootNodes.findIndex((n) => n.isDefault);
  if (defaultIndex > 0) {
    rootNodes.unshift(...rootNodes.splice(defaultIndex, 1));
  }

  return { folderTree: rootNodes, rootChecks };
}
