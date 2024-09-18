import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Label, RadioButtonGroup, Stack, Text } from '@grafana/ui';

import { CheckFormValues, CheckType, CheckTypeGroup } from 'types';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { fallbackCheckMap } from 'components/constants';

import { toFormValues } from '../checkFormTransformations';

type RefType = Partial<Record<CheckType, CheckFormValues>>;

interface ChooseCheckTypeProps {
  checkType: CheckType;
  checkTypeGroup: CheckTypeGroup;
  disabled: boolean;
}

export const ChooseCheckType = ({ checkType, checkTypeGroup, disabled }: ChooseCheckTypeProps) => {
  const history = useHistory();
  const ref = useRef<RefType>({});
  const options = useCheckTypeOptions();
  const groupOptions = options.filter((option) => option.group === checkTypeGroup);
  const { getValues, reset } = useFormContext();

  const handleCheckTypeChange = (newCheckType: CheckType) => {
    ref.current = {
      ...ref.current,
      [checkType]: getValues(),
    };

    const values = updateCheckTypeValues(ref.current, newCheckType, checkType);
    reset(values);
    history.replace({ search: `?checkType=${newCheckType}` }); // todo: preserve all query params
  };

  if (groupOptions.length === 1) {
    return null;
  }

  const { description } = groupOptions.find((option) => option.value === checkType) || {};
  const requestTypeOptions = groupOptions.map(({ label, value }) => {
    const standard = { label, value };

    if (disabled && value !== checkType) {
      return {
        ...standard,
        description: `You can not modify this check type after it has been created.`,
      };
    }

    return standard;
  });

  return (
    <div>
      <Label>Request type</Label>
      <Stack direction={`column`}>
        <div data-fs-element={`Request type selector`}>
          <RadioButtonGroup
            aria-label={`Request type`}
            options={requestTypeOptions}
            value={checkType}
            onChange={handleCheckTypeChange}
            disabled={disabled}
          />
        </div>
        <Stack alignItems={`center`}>
          {description && (
            <Text color={'secondary'} variant="bodySmall">
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </div>
  );
};

function updateCheckTypeValues(refValues: RefType, checkType: CheckType, currentCheckType: CheckType) {
  if (Object.hasOwnProperty.call(refValues, checkType)) {
    return refValues[checkType];
  }

  return toFormValues(
    {
      ...fallbackCheckMap[checkType],
      job: refValues?.[currentCheckType]?.job || fallbackCheckMap[checkType].job,
    },
    checkType
  );
}
