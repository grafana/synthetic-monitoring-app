import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, MultiSelect } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';

const validStatusCodes = generateValidStatusCodes();

export const HttpCheckValidStatusCodes = () => {
  const { control } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const id = 'validStatusCodes';

  return (
    <Field
      data-fs-element="Valid status codes select"
      description="Accepted status codes for this probe. Defaults to 2xx."
      htmlFor={id}
      label="Valid status codes"
    >
      <Controller
        control={control}
        name="settings.http.validStatusCodes"
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <MultiSelect
              {...rest}
              disabled={isFormDisabled}
              inputId={id}
              onChange={(values) => onChange(values.map((v) => v.value))}
              options={validStatusCodes}
            />
          );
        }}
      />
    </Field>
  );
};

function generateValidStatusCodes() {
  let validCodes = [];
  for (let i = 100; i <= 102; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 200; i <= 208; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 300; i <= 308; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 400; i <= 418; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '422',
    value: 422,
  });
  validCodes.push({
    label: '426',
    value: 426,
  });
  validCodes.push({
    label: '428',
    value: 428,
  });
  validCodes.push({
    label: '429',
    value: 429,
  });
  validCodes.push({
    label: '431',
    value: 431,
  });
  for (let i = 500; i <= 511; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '598',
    value: 598,
  });
  validCodes.push({
    label: '599',
    value: 599,
  });
  return validCodes;
}
