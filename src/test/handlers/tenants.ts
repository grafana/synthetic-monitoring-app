import { TENANT, TENANT_LIMITS, TENANT_SETTINGS, UPDATE_TENANT_SETTINGS } from 'test/fixtures/tenants';

import { ApiEntry } from 'test/handlers/types';
import {
  ListTenantLimitsResponse,
  ListTenantSettingsResult,
  TenantResponse,
  UpdateTenantSettingsResult,
} from 'datasource/responses.types';

export const getTenant: ApiEntry<TenantResponse> = {
  route: `/sm/tenant`,
  method: `get`,
  result: () => {
    return {
      json: TENANT,
    };
  },
};

export const getTenantSettings: ApiEntry<ListTenantSettingsResult> = {
  route: `/sm/tenant/settings`,
  method: `get`,
  result: () => {
    return {
      json: TENANT_SETTINGS,
    };
  },
};

export const updateTenantSettings: ApiEntry<UpdateTenantSettingsResult> = {
  route: `/sm/tenant/settings/update`,
  method: `post`,
  result: () => {
    return {
      json: UPDATE_TENANT_SETTINGS,
    };
  },
};

export const getTenantLimits: ApiEntry<ListTenantLimitsResponse> = {
  route: `/sm/tenant/limits`,
  method: `get`,
  result: () => {
    return {
      json: TENANT_LIMITS,
    };
  },
};
