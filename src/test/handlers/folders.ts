import { FOLDER_FORBIDDEN_UID, MOCK_FOLDERS } from 'test/fixtures/folders';

import { ApiEntry } from './types';
import { GrafanaFolder } from 'types';

/**
 * GET /api/folders — list endpoint.
 * Returns only { uid, title, url, parentUid } to match the real API,
 * which does NOT include permission fields (canEdit, canAdmin, etc.).
 */
export const listFolders: ApiEntry<Array<Pick<GrafanaFolder, 'uid' | 'title' | 'url' | 'parentUid'>>> = {
  route: `/api/folders`,
  method: `get`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const parentUid = url.searchParams.get('parentUid');

    const filtered = parentUid
      ? MOCK_FOLDERS.filter((f) => f.parentUid === parentUid)
      : MOCK_FOLDERS.filter((f) => !f.parentUid);

    const stripped = filtered.map(({ uid, title, url, parentUid }) => ({ uid, title, url, parentUid }));

    return { json: stripped };
  },
};

/**
 * GET /api/folders/:uid — detail endpoint.
 * Returns the full folder object including permission fields.
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

    const folder = MOCK_FOLDERS.find((f) => f.uid === uid);

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
