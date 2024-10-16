import React from 'react';

import { CheckType } from 'types';
import { useLimits } from 'hooks/useLimits';

import { BrowserCheckLimitAlert } from './BrowserCheckLimitAlert';
import { CheckLimitAlert } from './CheckLimitAlert';
import { ExecutionLimitAlert } from './ExecutionLimitAlert';
import { ScriptedCheckLimitAlert } from './ScriptedCheckLimitAlert';

export const OverLimitAlert = ({ checkType }: { checkType?: CheckType }) => {
  const { isOverBrowserLimit, isOverScriptedLimit, isOverCheckLimit, isOverHgExecutionLimit } = useLimits();

  if (isOverHgExecutionLimit) {
    return <ExecutionLimitAlert />;
  }

  if (isOverCheckLimit) {
    return <CheckLimitAlert />;
  }

  if (isOverScriptedLimit && getIsRelevant(checkType, [CheckType.Scripted, CheckType.MULTI_HTTP])) {
    return <ScriptedCheckLimitAlert />;
  }

  if (isOverBrowserLimit && getIsRelevant(checkType, [CheckType.Browser])) {
    return <BrowserCheckLimitAlert />;
  }

  return null;
};

function getIsRelevant(checkType?: CheckType, relevantCheckTypes?: CheckType[]) {
  if (!checkType) {
    return true;
  }

  if (relevantCheckTypes?.includes(checkType)) {
    return true;
  }

  return false;
}
