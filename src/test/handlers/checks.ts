import { BASIC_CHECK_LIST, BASIC_HTTP_CHECK, CheckInfo } from 'test/fixtures/checks';

import { ApiEntry } from 'test/handlers/types';
import {
  AddCheckResult,
  BulkUpdateCheckResult,
  CheckInfoResult,
  ListCheckResult,
  UpdateCheckResult,
} from 'datasource/responses.types';

export const listChecks: ApiEntry<ListCheckResult> = {
  route: `/sm/check/list`,
  method: `get`,
  result: () => {
    return {
      json: BASIC_CHECK_LIST,
    };
  },
};

export const addCheck: ApiEntry<AddCheckResult> = {
  route: `/sm/check/add`,
  method: `post`,
  result: () => {
    return {
      json: BASIC_HTTP_CHECK,
    };
  },
};

export const updateCheck: ApiEntry<UpdateCheckResult> = {
  route: `/sm/check/update`,
  method: `post`,
  result: (req) => {
    return {
      json: BASIC_HTTP_CHECK,
    };
  },
};

export const bulkUpdateChecks: ApiEntry<BulkUpdateCheckResult> = {
  route: `/sm/check/update/bulk`,
  method: `post`,
  result: () => {
    return {
      json: {
        msg: `Bulk update successful`,
      },
    };
  },
};

export const checkInfo: ApiEntry<CheckInfoResult> = {
  route: `/sm/checks/info`,
  method: `get`,
  result: () => {
    return {
      json: CheckInfo,
    };
  },
};
