import React from 'react';
import { RadioButtonGroup, Stack, Text } from '@grafana/ui';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckType } from 'types';

import { CHECK_TYPE_OPTION_MAP } from '../../constants';
import { useChecksterContext } from '../../contexts/ChecksterContext';
import { useCheckTypeOptions } from '../../hooks/useCheckTypeOptions';
import { getCheckTypeOption } from '../../utils/check';
import { StyledField } from '../ui/StyledField';

export function ChooseCheckType() {
  const { changeCheckType, checkType, canChangeCheckType } = useChecksterContext();

  const options = useCheckTypeOptions(CHECK_TYPE_OPTION_MAP[checkType].group);

  const handleCheckTypeChange = (newType: CheckType) => {
    changeCheckType(newType);
  };

  const { description } = getCheckTypeOption(checkType);

  return (
    <StyledField label="Request type" emulate>
      <Stack direction="column">
        <div>
          <RadioButtonGroup
            data-testid={CHECKSTER_TEST_ID.form.inputs.chooseAPICheckType}
            disabled={!canChangeCheckType}
            value={checkType}
            aria-label={`Request type`}
            options={options}
            onChange={handleCheckTypeChange}
          />
        </div>
        {description && (
          <Text color={'secondary'} variant="bodySmall">
            {description}
          </Text>
        )}
      </Stack>
    </StyledField>
  );
}
