import { GrafanaFolder } from 'types';

import { getFolderPath, getFolderPathParts } from './useFolders';

const ROOT: GrafanaFolder = { uid: 'root', title: 'Root', url: '' };
const CHILD: GrafanaFolder = { uid: 'child', title: 'Child', url: '', parentUid: 'root' };
const GRANDCHILD: GrafanaFolder = { uid: 'grandchild', title: 'Grandchild', url: '', parentUid: 'child' };

const allFolders = [ROOT, CHILD, GRANDCHILD];
const foldersMap = new Map(allFolders.map((f) => [f.uid, f]));

describe('getFolderPathParts', () => {
  it('returns single-element array for root folder', () => {
    expect(getFolderPathParts(ROOT, foldersMap)).toEqual(['Root']);
  });

  it('returns [parent, child] for nested folder', () => {
    expect(getFolderPathParts(CHILD, foldersMap)).toEqual(['Root', 'Child']);
  });

  it('returns full parts for deeply nested folder', () => {
    expect(getFolderPathParts(GRANDCHILD, foldersMap)).toEqual(['Root', 'Child', 'Grandchild']);
  });

  it('returns single-element array when parent is missing from map', () => {
    const orphan: GrafanaFolder = { uid: 'orphan', title: 'Orphan', url: '', parentUid: 'missing' };
    expect(getFolderPathParts(orphan, foldersMap)).toEqual(['Orphan']);
  });

  it('preserves separator characters within folder titles', () => {
    const tricky: GrafanaFolder = { uid: 'tricky', title: 'Prod > Staging', url: '', parentUid: 'root' };
    const map = new Map([...foldersMap, [tricky.uid, tricky]]);
    expect(getFolderPathParts(tricky, map)).toEqual(['Root', 'Prod > Staging']);
  });
});

describe('getFolderPath', () => {
  it('returns title for root folder', () => {
    expect(getFolderPath(ROOT, foldersMap)).toBe('Root');
  });

  it('returns parent > child path for nested folder', () => {
    expect(getFolderPath(CHILD, foldersMap)).toBe('Root > Child');
  });

  it('returns full path for deeply nested folder', () => {
    expect(getFolderPath(GRANDCHILD, foldersMap)).toBe('Root > Child > Grandchild');
  });

  it('returns partial path when parent is missing from map', () => {
    const orphan: GrafanaFolder = { uid: 'orphan', title: 'Orphan', url: '', parentUid: 'missing' };
    expect(getFolderPath(orphan, foldersMap)).toBe('Orphan');
  });
});
