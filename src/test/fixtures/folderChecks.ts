import { Check } from 'types';

import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK } from './checks';
import { FOLDER_FORBIDDEN_UID, FOLDER_PRODUCTION, FOLDER_READONLY, FOLDER_STAGING } from './folders';

export const CHECK_IN_PRODUCTION: Check = {
  ...BASIC_HTTP_CHECK,
  id: 200,
  job: 'Production HTTP check',
  folderUid: FOLDER_PRODUCTION.uid,
};

export const CHECK_IN_STAGING: Check = {
  ...BASIC_DNS_CHECK,
  id: 201,
  job: 'Staging DNS check',
  folderUid: FOLDER_STAGING.uid,
};

export const CHECK_IN_READONLY_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 202,
  job: 'Read-only folder check',
  folderUid: FOLDER_READONLY.uid,
};

export const CHECK_IN_FORBIDDEN_FOLDER: Check = {
  ...BASIC_HTTP_CHECK,
  id: 203,
  job: 'Forbidden folder check',
  folderUid: FOLDER_FORBIDDEN_UID,
};

export const CHECK_WITHOUT_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 204,
  job: 'Unassigned check',
  folderUid: undefined,
};

export const CHECK_WITH_ORPHANED_FOLDER: Check = {
  ...BASIC_DNS_CHECK,
  id: 205,
  job: 'Orphaned folder check',
  folderUid: 'deleted-folder-uid',
};
