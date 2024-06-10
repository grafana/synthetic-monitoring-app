import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Label, RadioButtonGroup } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useFormCheckType } from 'components/CheckForm/useCheckType';
import { fallbackCheckMap } from 'components/constants';

import { toFormValues } from '../checkFormTransformations';

type RefType = Partial<Record<CheckType, CheckFormValues>>;

export const ChooseCheckType = () => {
  const history = useHistory();
  const ref = useRef<RefType>({});
  const options = useCheckTypeOptions();
  const checkType = useFormCheckType();
  const { getValues, reset } = useFormContext();

  const handleCheckTypeChange = (newCheckType: CheckType) => {
    ref.current = {
      ...ref.current,
      [checkType]: getValues(),
    };

    const values = updateCheckTypeValues(ref.current, newCheckType);
    reset(values);
    history.replace({ search: `?checkType=${newCheckType}` }); // todo: preserve all query params
  };

  const id = 'check-type';

  return (
    <div>
      <Label htmlFor={id}>Request type</Label>
      <RadioButtonGroup id={id} options={options} value={checkType} onChange={handleCheckTypeChange} />
    </div>
  );
};

function updateCheckTypeValues(refValues: RefType, checkType: CheckType) {
  if (Object.hasOwnProperty.call(refValues, checkType)) {
    return refValues[checkType];
  }

  return toFormValues(fallbackCheckMap[checkType], checkType);
}
