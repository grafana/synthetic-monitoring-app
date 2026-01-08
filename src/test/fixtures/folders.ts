import { GrafanaFolder } from 'types';

export const MOCK_FOLDERS: GrafanaFolder[] = [
  {
    id: 1,
    uid: 'platform-team',
    title: 'Platform Team',
    url: '/dashboards/f/platform-team/platform-team',
    hasAcl: true,
    canSave: true,
    canEdit: true,
    canAdmin: true,
    canDelete: true,
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    version: 1,
  },
  {
    id: 2,
    uid: 'frontend-team',
    title: 'Frontend Team',
    url: '/dashboards/f/frontend-team/frontend-team',
    hasAcl: true,
    canSave: true,
    canEdit: true,
    canAdmin: true,
    canDelete: true,
    created: '2024-01-15T10:05:00Z',
    updated: '2024-01-15T10:05:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    version: 1,
  },
  {
    id: 3,
    uid: 'sre-team',
    title: 'SRE Team',
    url: '/dashboards/f/sre-team/sre-team',
    hasAcl: true,
    canSave: true,
    canEdit: true,
    canAdmin: true,
    canDelete: true,
    created: '2024-01-15T10:10:00Z',
    updated: '2024-01-15T10:10:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    version: 1,
  },
  {
    id: 4,
    uid: 'readonly-team',
    title: 'External Partners (Read-only)',
    url: '/dashboards/f/readonly-team/external-partners-read-only',
    hasAcl: true,
    canSave: false,
    canEdit: false,
    canAdmin: false,
    canDelete: false,
    created: '2024-01-15T10:15:00Z',
    updated: '2024-01-15T10:15:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    version: 1,
  },
];

export const PLATFORM_TEAM_FOLDER = MOCK_FOLDERS[0];
export const FRONTEND_TEAM_FOLDER = MOCK_FOLDERS[1];
export const SRE_TEAM_FOLDER = MOCK_FOLDERS[2];
export const READONLY_TEAM_FOLDER = MOCK_FOLDERS[3];


