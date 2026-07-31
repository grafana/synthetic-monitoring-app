import {
  TENANT,
  TENANT_COST_ATTRIBUTION_LABELS,
  TENANT_LIMITS,
  TENANT_SETTINGS,
  UPDATE_TENANT_SETTINGS,
} from 'test/fixtures/tenants';

import { ApiEntry } from 'test/handlers/types';
import {
  ListTenantCostAttributionLabelsResponse,
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

export const getTenantCostAttributionLabels: ApiEntry<ListTenantCostAttributionLabelsResponse> = {
  route: `/sm/tenant/cals`,
  method: `get`,
  result: () => {
    // Dev-mode demo toggle: append `&sm-demo-no-cals` to the page URL when running
    // `yarn dev:msw` to preview the "no cost attribution labels configured" state
    // (e.g. the cost attribution discovery nudges). Never set in tests.
    if (typeof window !== 'undefined' && window.location.search.includes('sm-demo-no-cals')) {
      return {
        json: { names: [] },
      };
    }

    return {
      json: TENANT_COST_ATTRIBUTION_LABELS,
    };
  },
};
