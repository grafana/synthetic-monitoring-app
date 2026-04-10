import { FULL_WRITER_ACCESS } from 'test/fixtures/rbacPermissions';
import { runTestAsRBACEditor, runTestAsRBACReader } from 'test/utils';

import {
  CheckFolderStatus,
    computeCheckPermissions,
  FolderAccessState,
  isCheckVisible,
  resolveCheckFolderStatus,
} from './folderPermissions';
import { getUserPermissions } from './permissions';

const smWriter = () => {
  runTestAsRBACEditor();
  return getUserPermissions();
};

const smReader = () => {
  runTestAsRBACReader();
  return getUserPermissions();
};

const smWriterNoDelete = () => {
  const runtime = require('@grafana/runtime');
  jest.replaceProperty(runtime, 'config', {
    ...runtime.config,
    bootData: {
      ...runtime.config.bootData,
      user: { permissions: { ...FULL_WRITER_ACCESS, 'grafana-synthetic-monitoring-app.checks:delete': false } },
    },
  });
  return getUserPermissions();
};

const FOLDER_LOADING: FolderAccessState = { type: 'loading' };
const FOLDER_ADMIN: FolderAccessState = { type: 'accessible', permissions: { canEdit: true, canAdmin: true } };
const FOLDER_EDITOR: FolderAccessState = { type: 'accessible', permissions: { canEdit: true, canAdmin: false } };
const FOLDER_VIEWER: FolderAccessState = { type: 'accessible', permissions: { canEdit: false, canAdmin: false } };
const FOLDER_FORBIDDEN: FolderAccessState = { type: 'forbidden' };
const FOLDER_ORPHANED: FolderAccessState = { type: 'orphaned' };

describe('resolveCheckFolderStatus', () => {
  it('returns no-folder-context when folders feature is disabled', () => {
    const details = new Map([['folder-a', FOLDER_ADMIN]]);
    const result = resolveCheckFolderStatus({ folderUid: 'folder-a' }, details, false);
    expect(result.type).toBe('no-folder-context');
  });

  it('returns no-folder-context when check has no folderUid', () => {
    const result = resolveCheckFolderStatus({ folderUid: undefined }, new Map(), true);
    expect(result.type).toBe('no-folder-context');
  });

  it('resolves the default folder', () => {
    const defaultUid = 'grafana-synthetic-monitoring-app';
    const details = new Map([[defaultUid, FOLDER_EDITOR]]);
    const result = resolveCheckFolderStatus({ folderUid: defaultUid }, details, true);
    expect(result).toEqual(FOLDER_EDITOR);
  });

  it('returns accessible with permissions for an accessible folder', () => {
    const details = new Map([['folder-a', FOLDER_EDITOR]]);
    const result = resolveCheckFolderStatus({ folderUid: 'folder-a' }, details, true);
    expect(result).toEqual(FOLDER_EDITOR);
  });

  it('returns forbidden for a forbidden folder', () => {
    const details = new Map([['folder-a', FOLDER_FORBIDDEN]]);
    const result = resolveCheckFolderStatus({ folderUid: 'folder-a' }, details, true);
    expect(result).toEqual(FOLDER_FORBIDDEN);
  });

  it('returns orphaned for a deleted folder', () => {
    const details = new Map([['folder-a', FOLDER_ORPHANED]]);
    const result = resolveCheckFolderStatus({ folderUid: 'folder-a' }, details, true);
    expect(result).toEqual(FOLDER_ORPHANED);
  });

  it('returns forbidden when folder is not in the details map (safe default)', () => {
    const result = resolveCheckFolderStatus({ folderUid: 'unknown-folder' }, new Map(), true);
    expect(result).toEqual(FOLDER_FORBIDDEN);
  });
});

describe('isCheckVisible', () => {
  it.each<[CheckFolderStatus['type'], boolean]>([
    ['no-folder-context', true],
    ['loading', true],
    ['accessible', true],
    ['orphaned', true],
    ['forbidden', false],
  ])('returns %s for status type "%s"', (type, expected) => {
    const status: CheckFolderStatus = type === 'accessible'
      ? { type, permissions: { canEdit: true, canAdmin: true } }
      : { type } as CheckFolderStatus;

    expect(isCheckVisible(status)).toBe(expected);
  });
});

describe('computeCheckPermissions', () => {
  describe('no-folder-context (folders disabled or no folderUid)', () => {
    const status: CheckFolderStatus = { type: 'no-folder-context' };

    it('returns full SM RBAC for a writer', () => {
      expect(computeCheckPermissions(smWriter(), status)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
    });

    it('returns read-only for a reader', () => {
      expect(computeCheckPermissions(smReader(), status)).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
    });
  });

  describe('orphaned (folder deleted)', () => {
    const status: CheckFolderStatus = { type: 'orphaned' };

    it('returns full SM RBAC — folder no longer restricts', () => {
      expect(computeCheckPermissions(smWriter(), status)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
    });

    it('returns read-only for a reader', () => {
      expect(computeCheckPermissions(smReader(), status)).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
    });
  });

  describe('loading (permissions not yet resolved)', () => {
    it('allows read but disables write and delete', () => {
      expect(computeCheckPermissions(smWriter(), FOLDER_LOADING)).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
    });
  });

  describe('accessible — combined model: min(SM RBAC, folder permission)', () => {
    it('SM writer + folder Admin → full access', () => {
      expect(computeCheckPermissions(smWriter(), FOLDER_ADMIN)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
    });

    it('SM writer + folder Edit → can read + write, not delete', () => {
      expect(computeCheckPermissions(smWriter(), FOLDER_EDITOR)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
      });
    });

    it('SM writer + folder View → can only read (folder is the ceiling)', () => {
      expect(computeCheckPermissions(smWriter(), FOLDER_VIEWER)).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
    });

    it('SM reader + folder Admin → can only read (SM role is the ceiling)', () => {
      expect(computeCheckPermissions(smReader(), FOLDER_ADMIN)).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
    });

    it('SM writer-no-delete + folder Edit → can read + write, not delete', () => {
      expect(computeCheckPermissions(smWriterNoDelete(), FOLDER_EDITOR)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
      });
    });

    it('SM writer-no-delete + folder Admin → can read + write, not delete (SM is ceiling)', () => {
      expect(computeCheckPermissions(smWriterNoDelete(), FOLDER_ADMIN)).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
      });
    });
  });

  describe('folder is forbidden — all false regardless of SM RBAC', () => {
    it('returns all false even for a full writer', () => {
      expect(computeCheckPermissions(smWriter(), FOLDER_FORBIDDEN)).toEqual({
        canRead: false,
        canWrite: false,
        canDelete: false,
      });
    });
  });
});
