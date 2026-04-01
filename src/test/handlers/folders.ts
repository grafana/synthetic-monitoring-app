import { MOCK_FOLDERS } from 'test/fixtures/folders';

import { ApiEntry } from './types';
import { GrafanaFolder } from 'types';

export const listFolders: ApiEntry<GrafanaFolder[]> = {
  route: `/api/folders`,
  method: `get`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const parentUid = url.searchParams.get('parentUid');

    const filtered = parentUid
      ? MOCK_FOLDERS.filter((f) => f.parentUid === parentUid)
      : MOCK_FOLDERS.filter((f) => !f.parentUid);

    return { json: filtered };
  },
};

export const getFolder: ApiEntry<GrafanaFolder> = {
  route: /\/api\/folders\/[^/]+$/,
  method: `get`,
  result: async (req: Request) => {
    const url = new URL(req.url);
    const uid = url.pathname.split('/').pop()!;
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
