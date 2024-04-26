import React from 'react';

import { CheckType } from 'types';

import { RequestTargetInput } from './RequestTargetInput';

interface Props {
  checkType: CheckType;
}

export const CheckTarget = ({ checkType }: Props) => (
  <RequestTargetInput checkType={checkType} data-testid="check-editor-target" id="check-target" name="target" />
);
