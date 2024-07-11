import { Check, CheckType, FeatureName } from 'types';
import { getCheckType } from 'utils';
import { ListCheckResult, ListTenantLimitsResponse } from 'datasource/responses.types';
import { useChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';

import { useFeatureFlag } from './useFeatureFlag';

export function useLimits() {
  const { data: limits, isLoading, error } = useTenantLimits();
  const { data: checks } = useChecks();
  const isOverCheckLimit = getIsOverCheckLimit({ checks, limits });
  const isScriptedOn = useFeatureFlag(FeatureName.ScriptedChecks);
  const isOverScriptedLimit = isScriptedOn && getIsOverScriptedLimit({ checks, limits });

  return {
    limits,
    isLoading,
    isOverCheckLimit,
    isOverScriptedLimit,
    error,
  };
}

function getIsOverScriptedLimit({
  checks,
  limits,
}: {
  checks?: Check[] | ListCheckResult;
  limits?: ListTenantLimitsResponse;
}): boolean {
  if (!limits || !checks) {
    return false;
  }
  const scriptedChecksCount = checks.filter((c) => getCheckType(c.settings) === CheckType.Scripted).length;
  return scriptedChecksCount >= limits.MaxScriptedChecks;
}

function getIsOverCheckLimit({
  checks,
  limits,
}: {
  checks?: Check[] | ListCheckResult;
  limits?: ListTenantLimitsResponse;
}): boolean {
  if (!limits || !checks) {
    return false;
  }
  return checks.length >= limits.MaxChecks;
}
