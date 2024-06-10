import React, { useId, useState } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues, CheckType } from 'types';

type RequestMethodInputProps = {
  'aria-label'?: string;
  'data-testid'?: string;
  name: FieldPath<CheckFormValues>;
  description: string;
  placeholder: string;
};

export const RequestTargetInput = ({
  'aria-label': ariaLabel,
  name,
  'data-testid': dataTestId,
  description,
  placeholder,
}: RequestMethodInputProps) => {
  const { control, formState } = useFormContext<CheckFormValues>();
  const error = get(formState.errors, name);
  const styles = useStyles2(getStyles);
  const id = useId().replace(/:/g, '_');
  const [showPlaceholder, setShowplaceholder] = useState(true);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <>
          <Field
            label="Request target"
            description={description}
            invalid={Boolean(error)}
            error={error?.message}
            className={styles.requestTargetInput}
            htmlFor={id}
          >
            <Input
              aria-label={ariaLabel}
              id={id}
              data-testid={dataTestId}
              placeholder={showPlaceholder ? placeholder : undefined}
              data-fs-element="Target input"
              onFocus={() => setShowplaceholder(false)}
              {...field}
              onBlur={() => {
                setShowplaceholder(true);
                field.onBlur();
              }}
              value={typeof field.value === `string` ? field.value : ''}
            />
          </Field>
        </>
      )}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  requestTargetInput: css({
    minWidth: theme.spacing(40),
    margin: 0,
  }),
});

interface TargetHelpInfo {
  text?: string;
  example: string;
}

const getTargetHelpText = (typeOfCheck: CheckType | undefined): TargetHelpInfo => {
  if (!typeOfCheck) {
    return { text: '', example: '' };
  }
  let resp: TargetHelpInfo = {
    text: 'Full URL to send requests to',
    example: 'https://grafana.com/',
  };
  switch (typeOfCheck) {
    case CheckType.Scripted: {
      resp = {
        text: 'The URL that best describes the target of the check',
        example: `https://grafana.com/`,
      };
      break;
    }
  }
  return resp;
};
