import { MOCK_FOLDERS } from 'test/fixtures/folders';

import { ApiEntry } from 'test/handlers/types';
import { GrafanaFolder } from 'types';

function buildParentsChain(folder: GrafanaFolder): GrafanaFolder[] {
  const parents: GrafanaFolder[] = [];
  let current = folder;
  while (current.parentUid) {
    const parent = MOCK_FOLDERS.find((f) => f.uid === current.parentUid);
    if (!parent) {
      break;
    }
    parents.unshift(parent);
    current = parent;
  }
  return parents;
}

export const listFolders: ApiEntry<GrafanaFolder[]> = {
  route: `/api/folders`,
  method: `get`,
  result: (req) => {
    const url = new URL(req.url, 'http://localhost');
    const parentUid = url.searchParams.get('parentUid');

    if (parentUid) {
      const children = MOCK_FOLDERS.filter((f) => f.parentUid === parentUid);
      return { json: children };
    }

    const rootFolders = MOCK_FOLDERS.filter((f) => !f.parentUid);
    return { json: rootFolders };
  },
};

export const getFolder: ApiEntry<GrafanaFolder> = {
  route: `/api/folders/([^/]+)`,
  method: `get`,
  result: (req) => {
    const uid = req.url.split('/').pop()?.split('?')[0];
    const folder = MOCK_FOLDERS.find((f) => f.uid === uid);

    if (!folder) {
      return {
        status: 404,
        json: { message: 'Folder not found' },
      };
    }

    return {
      json: {
        ...folder,
        parents: buildParentsChain(folder),
      },
    };
  },
};

export const createFolder: ApiEntry<GrafanaFolder> = {
  route: `/api/folders`,
  method: `post`,
  result: async (req) => {
    const body = await req.json();
    
    const newFolder: GrafanaFolder = {
      id: Date.now(),
      uid: `folder-${Date.now()}`,
      title: body.title,
      url: `/dashboards/f/folder-${Date.now()}/${body.title.toLowerCase()}`,
      hasAcl: false,
      canSave: true,
      canEdit: true,
      canAdmin: true,
      canDelete: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      version: 1,
    };

    return {
      json: newFolder,
    };
  },
};

export const updateFolder: ApiEntry<GrafanaFolder> = {
  route: `/api/folders/([^/]+)`,
  method: `put`,
  result: async (req) => {
    const body = await req.json();
    const uid = req.url.split('/').pop();
    const folder = MOCK_FOLDERS.find((f) => f.uid === uid);

    if (!folder) {
      return {
        status: 404,
        json: { message: 'Folder not found' },
      };
    }

    return {
      json: {
        ...folder,
        title: body.title,
        version: (folder.version || 0) + 1,
        updated: new Date().toISOString(),
      },
    };
  },
};

export const deleteFolder: ApiEntry<{ message: string; id: number }> = {
  route: `/api/folders/([^/]+)`,
  method: `delete`,
  result: (req) => {
    const uid = req.url.split('/').pop();
    const folder = MOCK_FOLDERS.find((f) => f.uid === uid);

    if (!folder) {
      return {
        status: 404,
        json: { message: 'Folder not found' },
      };
    }

    return {
      json: { message: 'Folder deleted', id: folder.id },
    };
  },
};

