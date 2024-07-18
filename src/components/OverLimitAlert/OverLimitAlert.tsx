import React from 'react';

import { CheckType, ROUTES } from 'types';
import { useLimits } from 'hooks/useLimits';
import { useNavigation } from 'hooks/useNavigation';
import { ErrorAlert } from 'components/ErrorAlert';

export const OverLimitAlert = ({ checkType }: { checkType?: CheckType }) => {
  const nav = useNavigation();
  const { limits, isOverScriptedLimit, isOverCheckLimit } = useLimits();
  const isRelevant = getIsRelevant(checkType);

  if (isOverCheckLimit) {
    return (
      <ErrorAlert
        title="Check limit reached"
        content={`You have reached the limit of checks you can create. Your current limit is ${limits?.MaxChecks}. You can delete existing checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
        buttonText={'Back to checks'}
        onClick={() => {
          nav(ROUTES.Checks);
        }}
      />
    );
  }

  if (isOverScriptedLimit && isRelevant) {
    return (
      <ErrorAlert
        title="Check limit reached"
        content={`You have reached the limit of scripted and multiHTTP checks you can create. Your current limit is ${limits?.MaxScriptedChecks}. You can delete existing multiHTTP or scripted checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
        buttonText={'Back to checks'}
        onClick={() => {
          nav(ROUTES.Checks);
        }}
      />
    );
  }

  return null;
};

function getIsRelevant(checkType?: CheckType) {
  if (!checkType) {
    return true;
  }

  if ([CheckType.Scripted, CheckType.MULTI_HTTP].includes(checkType)) {
    return true;
  }

  return false;
}
