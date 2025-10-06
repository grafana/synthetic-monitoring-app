import React from 'react';
import { Label, RadioButtonGroup, Stack, Text } from '@grafana/ui';

import { CheckType } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { useCheckTypeOptions } from '../../hooks/useCheckTypeOptions';
import { getCheckTypeOption } from '../../utils/check';

export function ChooseCheckType() {
  const {
    setCheck,
    checkMeta: { type, group, isNew },
  } = useChecksterContext();

  // TODO: Do we need to use `updateCheckTypeValues` and `reset`? (@see ChooseCheckType in old Checkster)

  const options = useCheckTypeOptions(group);

  const handleCheckTypeChange = (newValue: CheckType) => {
    // This should probably trigger an emitting of some sort (if we want to update search params or something).
    setCheck({ type: newValue });
  };

  const { description } = getCheckTypeOption(type);

  return (
    <Stack direction="column" gap={0}>
      <Label>Request type</Label>
      <Stack direction="column">
        <div>
          <RadioButtonGroup
            disabled={!isNew}
            value={type}
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
    </Stack>
  );
}
