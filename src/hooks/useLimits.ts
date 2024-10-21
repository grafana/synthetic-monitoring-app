import { Check, CheckType, FeatureName } from 'types';
import { getCheckType } from 'utils';
import { ListCheckResult, ListTenantLimitsResponse } from 'datasource/responses.types';
import { useChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';

import { useAtHgExecutionLimit } from './useAtHgExecutionLimit';
import { useFeatureFlag } from './useFeatureFlag';

export function useLimits() {
  const {
    data: tenantLimits,
    isLoading: isLoadingTenant,
    error: errorTenant,
    isFetched: isFetchedTenant,
  } = useTenantLimits();
  const { data: checks } = useChecks();
  const { data: isOverHgExecutionLimit, isLoading: isLoadingHgLimit } = useAtHgExecutionLimit();

  const isOverCheckLimit = getIsOverCheckLimit({ checks, tenantLimits });
  const isScriptedOn = useFeatureFlag(FeatureName.ScriptedChecks);
  const isBrowserOn = useFeatureFlag(FeatureName.BrowserChecks);
  const isOverScriptedLimit = isScriptedOn && getIsOverScriptedLimit({ checks, tenantLimits });
  const isOverBrowserLimit = isBrowserOn && getIsOverBrowserLimit({ checks, tenantLimits });

  return {
    tenantLimits: tenantLimits,
    isLoading: isLoadingTenant || isLoadingHgLimit,
    isReady: isFetchedTenant && !isLoadingHgLimit,
    isOverCheckLimit,
    isOverHgExecutionLimit,
    isOverScriptedLimit,
    isOverBrowserLimit,
    error: errorTenant,
  };
}

function getIsOverBrowserLimit({
  checks,
  tenantLimits,
}: {
  checks?: Check[] | ListCheckResult;
  tenantLimits?: ListTenantLimitsResponse;
}): boolean {
  if (!tenantLimits || !checks) {
    return false;
  }

  const browserChecksCount = checks.filter((c) => getCheckType(c.settings) === CheckType.Browser).length;
  return browserChecksCount >= tenantLimits.MaxBrowserChecks;
}

function getIsOverScriptedLimit({
  checks,
  tenantLimits,
}: {
  checks?: Check[] | ListCheckResult;
  tenantLimits?: ListTenantLimitsResponse;
}): boolean {
  if (!tenantLimits || !checks) {
    return false;
  }

  const scriptedChecksCount = checks.filter((c) => getCheckType(c.settings) === CheckType.Scripted).length;
  return scriptedChecksCount >= tenantLimits.MaxScriptedChecks;
}

function getIsOverCheckLimit({
  checks,
  tenantLimits,
}: {
  checks?: Check[] | ListCheckResult;
  tenantLimits?: ListTenantLimitsResponse;
}): boolean {
  if (!tenantLimits || !checks) {
    return false;
  }

  return checks.length >= tenantLimits.MaxChecks;
}
