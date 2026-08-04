import { GrafanaFolder } from 'types';
import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID } from 'data/folders.constants';

export const DEFAULT_FOLDER: GrafanaFolder = {
  uid: DEFAULT_FOLDER_UID,
  title: DEFAULT_FOLDER_TITLE,
  url: `/dashboards/f/${DEFAULT_FOLDER_UID}/grafana-synthetic-monitoring`,
  canEdit: true,
  canDelete: false,
  canAdmin: true,
  canSave: true,
};

export const FOLDER_PRODUCTION: GrafanaFolder = {
  uid: 'folder-production',
  title: 'Production',
  url: '/dashboards/f/folder-production/production',
  parentUid: DEFAULT_FOLDER_UID,
  canEdit: true,
  canDelete: true,
  canAdmin: false,
  canSave: true,
};

export const FOLDER_STAGING: GrafanaFolder = {
  uid: 'folder-staging',
  title: 'Staging',
  url: '/dashboards/f/folder-staging/staging',
  parentUid: DEFAULT_FOLDER_UID,
  canEdit: true,
  canDelete: true,
  canAdmin: false,
  canSave: true,
};

export const FOLDER_READONLY: GrafanaFolder = {
  uid: 'folder-readonly',
  title: 'Read Only',
  url: '/dashboards/f/folder-readonly/read-only',
  parentUid: DEFAULT_FOLDER_UID,
  canEdit: false,
  canDelete: false,
  canAdmin: false,
  canSave: false,
};

export const FOLDER_DELETABLE: GrafanaFolder = {
  uid: 'folder-deletable',
  title: 'Deletable',
  url: '/dashboards/f/folder-deletable/deletable',
  parentUid: DEFAULT_FOLDER_UID,
  canEdit: true,
  canDelete: true,
  canAdmin: true,
  canSave: true,
};

export const FOLDER_FORBIDDEN_UID = 'folder-forbidden';

/**
 * A readable folder living outside the default SM folder's subtree (no
 * parentUid, random-looking UID). Mirrors the "stranded" state created when a
 * duplicate default folder exists with a non-canonical UID, or when a check is
 * assigned to an arbitrary folder via the API. Deliberately NOT part of
 * MOCK_FOLDERS: the subtree list endpoint never returns it, only the detail
 * endpoint does.
 */
export const FOLDER_EXTERNAL: GrafanaFolder = {
  uid: 'afq0rsc7nhgcgc',
  title: 'Grafana Synthetic Monitoring',
  url: '/dashboards/f/afq0rsc7nhgcgc/grafana-synthetic-monitoring',
  canEdit: true,
  canDelete: true,
  canAdmin: false,
  canSave: true,
};

export const MOCK_FOLDERS: GrafanaFolder[] = [
  DEFAULT_FOLDER,
  FOLDER_PRODUCTION,
  FOLDER_STAGING,
  FOLDER_READONLY,
  FOLDER_DELETABLE,
];
