import { ADHOC_CHECK_RESULT, BASIC_CHECK_LIST, BASIC_HTTP_CHECK, CheckInfo } from 'test/fixtures/checks';

import { ApiEntry } from 'test/handlers/types';
import {
  AddCheckResult,
  AdHocCheckResponse,
  BulkUpdateCheckResult,
  CheckInfoResult,
  DeleteCheckResult,
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
  result: async (req) => {
    return {
      json: {
        ...(await req.json()),
      },
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

export const deleteCheck: ApiEntry<DeleteCheckResult> = {
  route: `/sm/check/delete/([^/]+)`,
  method: `delete`,
  result: (req) => {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    return {
      status: 200,
      json: { msg: `Check deleted`, checkId: Number(id) },
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

export const testCheck: ApiEntry<AdHocCheckResponse> = {
  route: `/sm/check/adhoc`,
  method: `post`,
  result: () => {
    return {
      json: ADHOC_CHECK_RESULT,
    };
  },
};
