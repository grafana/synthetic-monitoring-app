import React from 'react';

import { CheckType } from 'types';
import { useFormCheckType } from 'components/CheckForm/useCheckType';

import { RequestMethodAndTarget } from './RequestMethodAndTarget';
import { RequestTargetInput } from './RequestTargetInput';

export const CheckTarget = () => {
  const checkType = useFormCheckType();

  if (checkType === CheckType.HTTP) {
    return (
      <RequestMethodAndTarget checkType={CheckType.HTTP} methodName={`settings.http.method`} targetName="target" />
    );
  }

  if (checkType === CheckType.MULTI_HTTP || checkType === CheckType.Scripted) {
    return null;
  }

  return <RequestTargetInput checkType={checkType} data-testid="check-editor-target" id="check-target" name="target" />;
};
