import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Badge, BadgeColor, Label, RadioButtonGroup, Stack } from '@grafana/ui';

import { CheckFormValues, CheckStatus, CheckType } from 'types';
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
  const { description, status } = options.find((option) => option.value === checkType) || {};

  return (
    <div>
      <Label htmlFor={id}>Request type</Label>
      <Stack direction={`column`}>
        <div>
          <RadioButtonGroup
            id={id}
            options={options.map(({ label, value }) => ({ label, value }))}
            value={checkType}
            onChange={handleCheckTypeChange}
          />
        </div>
        <Stack>
          {description}
          {status && <CheckBadge status={status} />}
        </Stack>
      </Stack>
    </div>
  );
};

const colorMap: Record<CheckStatus, { text: string; color: BadgeColor }> = {
  [CheckStatus.EXPERIMENTAL]: {
    color: 'orange',
    text: `Experimental`,
  },
  [CheckStatus.PUBLIC_PREVIEW]: {
    color: 'blue',
    text: `Public preview`,
  },
};

const CheckBadge = ({ status }: { status: CheckStatus }) => {
  const { text, color } = colorMap[status];

  return <Badge text={text} color={color} />;
};

function updateCheckTypeValues(refValues: RefType, checkType: CheckType) {
  if (Object.hasOwnProperty.call(refValues, checkType)) {
    return refValues[checkType];
  }

  return toFormValues(fallbackCheckMap[checkType], checkType);
}
