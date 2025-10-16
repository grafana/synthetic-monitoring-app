import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { CheckFormFieldPath, HTTPAuthType } from '../../types';
import { CheckFormValues } from 'types';

import { FIELD_SPACING, HTTP_AUTH_TYPE_OPTIONS } from '../../constants';
import { getHttpAuthType } from '../../utils/form';
import { StyledField } from '../ui/StyledField';
import { FormHttpBasicAuthField } from './FormHttpBasicAuthField';
import { FormHttpBearerTokenField } from './FormHttpBearerTokenField';

interface FormHttpAuthenticationFieldProps {
  basicAuthField: CheckFormFieldPath;
  bearerTokenField: CheckFormFieldPath;
}

export function FormHttpAuthenticationField({ basicAuthField, bearerTokenField }: FormHttpAuthenticationFieldProps) {
  const {
    trigger,
    formState: { disabled },
    setValue,
    getValues,
    watch,
  } = useFormContext<CheckFormValues>();

  const basicAuthUsernameField = `${basicAuthField}.username` as any; // TODO: Fix any
  const basicAuthPasswordField = `${basicAuthField}.password` as any; // TODO: Fix any

  const basicAuth = watch(basicAuthField) as { username?: string; password?: string } | undefined;
  const bearerToken = watch(bearerTokenField) as string | undefined; // TODO: Fix casting

  const authType = getHttpAuthType(basicAuth, bearerToken);
  const dismountAuthType = useRef<HTTPAuthType>(authType);

  // Ensure form values are in sync with authType
  const handleChangeAuthType = (value: HTTPAuthType) => {
    dismountAuthType.current = value; // Store the selected auth type for cleanup on unmount

    switch (value) {
      case HTTPAuthType.BearerToken:
        setValue(basicAuthField, undefined);
        setValue(bearerTokenField, '');
        break;
      case HTTPAuthType.BasicAuth:
        setValue(bearerTokenField, undefined);
        setValue(basicAuthField, { username: '', password: '' });
        break;
      default:
        // None
        setValue(basicAuthField, undefined);
        setValue(bearerTokenField, undefined);
        trigger(basicAuthField);
        trigger(bearerTokenField);
    }
  };

  // TODO: Clean up value when form values are transformed into a `Check`
  // This is to mimic the behavior of the previous `HttpCheckAuthentication` component
  useEffect(() => {
    return () => {
      switch (dismountAuthType.current) {
        case HTTPAuthType.BearerToken:
          if (!getValues(bearerTokenField)) {
            setValue(bearerTokenField, undefined);
          }
          break;
        case HTTPAuthType.BasicAuth:
          if (!getValues(basicAuthUsernameField) && !getValues(basicAuthPasswordField)) {
            setValue(basicAuthField, undefined);
          }
          break;
        default:
        // None
      }
    };
  }, [
    basicAuthField,
    bearerTokenField,
    setValue,
    dismountAuthType,
    getValues,
    basicAuthUsernameField,
    basicAuthPasswordField,
  ]);

  return (
    <div>
      <Stack direction="column" gap={FIELD_SPACING}>
        <StyledField label="Authentication type" emulate>
          <RadioButtonGroup
            disabled={disabled}
            options={HTTP_AUTH_TYPE_OPTIONS}
            onChange={handleChangeAuthType}
            value={authType}
          />
        </StyledField>

        {authType === HTTPAuthType.BasicAuth && <FormHttpBasicAuthField field={basicAuthField} />}
        {authType === HTTPAuthType.BearerToken && <FormHttpBearerTokenField field={bearerTokenField} />}
      </Stack>
    </div>
  );
}
