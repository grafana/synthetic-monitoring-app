import { GrafanaFolder } from 'types';
import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID } from 'data/useDefaultFolder';

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

export const MOCK_FOLDERS: GrafanaFolder[] = [DEFAULT_FOLDER, FOLDER_PRODUCTION, FOLDER_STAGING, FOLDER_READONLY];
