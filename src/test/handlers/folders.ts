import { FOLDER_EXTERNAL, FOLDER_FORBIDDEN_UID, FOLDER_ROOT, FOLDER_ROOT_CHILD, MOCK_FOLDERS } from 'test/fixtures/folders';

import { ApiEntry } from './types';
import { GrafanaFolder } from 'types';

const LISTABLE_FOLDERS = [...MOCK_FOLDERS, FOLDER_ROOT, FOLDER_ROOT_CHILD];

/**
 * GET /api/folders — list endpoint.
 * Returns only { uid, title, url, parentUid } to match the real API,
 * which does NOT include permission fields (canEdit, canAdmin, etc.).
 * Supports `permission=Edit` the way the real endpoint does: server-side
 * filtering to folders the user can edit (the folder picker relies on it).
 */
export const listFolders: ApiEntry<Array<Pick<GrafanaFolder, 'uid' | 'title' | 'url' | 'parentUid'>>> = {
  route: `/api/folders`,
  method: `get`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const parentUid = url.searchParams.get('parentUid');
    const permission = url.searchParams.get('permission');

    // Without parentUid the endpoint returns root-level folders, which
    // includes FOLDER_ROOT (a folder outside the default subtree).
    let filtered = parentUid
      ? LISTABLE_FOLDERS.filter((f) => f.parentUid === parentUid)
      : LISTABLE_FOLDERS.filter((f) => !f.parentUid);

    if (permission === 'Edit') {
      filtered = filtered.filter((f) => f.canEdit);
    }

    const stripped = filtered.map(({ uid, title, url, parentUid }) => ({ uid, title, url, parentUid }));

    return { json: stripped };
  },
};

/**
 * GET /api/folders/:uid — detail endpoint.
 * Returns the full folder object including permission fields.
 * Also resolves FOLDER_EXTERNAL, which the list endpoint never returns
 * (it lives outside the default folder's subtree).
 * Returns 403 for FOLDER_FORBIDDEN_UID, 404 for unknown UIDs.
 */
export const getFolder: ApiEntry<GrafanaFolder> = {
  route: /\/api\/folders\/[^/]+$/,
  method: `get`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const uid = url.pathname.split('/').pop()!;

    if (uid === FOLDER_FORBIDDEN_UID) {
      return { status: 403, json: { message: 'Access denied' } };
    }

    const folder = [...LISTABLE_FOLDERS, FOLDER_EXTERNAL].find((f) => f.uid === uid);

    if (!folder) {
      return { status: 404, json: { message: 'Folder not found' } };
    }

    return { json: folder };
  },
};

export const createFolder: ApiEntry<GrafanaFolder> = {
  route: `/api/folders`,
  method: `post`,
  result: async (req: Request) => {
    const body = await req.json();
    const newFolder: GrafanaFolder = {
      uid: `folder-${Date.now()}`,
      title: body.title,
      url: `/dashboards/f/folder-${Date.now()}/${body.title.toLowerCase().replace(/\s+/g, '-')}`,
      parentUid: body.parentUid,
      canEdit: true,
      canDelete: true,
      canAdmin: true,
      canSave: true,
    };

    return { status: 200, json: newFolder };
  },
};

export const deleteFolder: ApiEntry<{ message: string }> = {
  route: /\/api\/folders\/[^/]+$/,
  method: `delete`,
  result: async () => {
    return { status: 200, json: { message: 'Folder deleted' } };
  },
};

/**
 * POST /api/folders/:uid/move — returns the folder with its new parentUid.
 * An empty parentUid in the body means the folder was moved to the root.
 */
export const moveFolder: ApiEntry<GrafanaFolder> = {
  route: /\/api\/folders\/[^/]+\/move$/,
  method: `post`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const uid = url.pathname.split('/').at(-2)!;
    const body = await req.json();

    const folder = LISTABLE_FOLDERS.find((f) => f.uid === uid);
    if (!folder) {
      return { status: 404, json: { message: 'Folder not found' } };
    }

    return { json: { ...folder, parentUid: body.parentUid || undefined } };
  },
};
