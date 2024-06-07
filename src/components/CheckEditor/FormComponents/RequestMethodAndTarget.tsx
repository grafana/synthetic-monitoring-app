import React, { useState } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Field, Input, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues, CheckType } from 'types';
import { hasRole } from 'utils';
import { METHOD_OPTIONS } from 'components/constants';

type RequestMethodInputProps = {
  'aria-label'?: string;
  checkType: CheckType;
  methodName: FieldPath<CheckFormValues>;
  targetName: FieldPath<CheckFormValues>;
};

export const RequestMethodAndTarget = ({
  'aria-label': ariaLabel = `Request target`,
  checkType,
  methodName,
  targetName,
}: RequestMethodInputProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control, formState, register } = useFormContext<CheckFormValues>();
  const targetField = register(targetName);
  const targetFieldError = get(formState.errors, targetName)?.message;
  const id = `request-method-${methodName}`;
  const styles = useStyles2(getStyles);
  const targetHelp = getTargetHelpText(checkType);
  const [showPlaceholder, setShowplaceholder] = useState(true);

  return (
    <Field
      label="Request target"
      description={targetHelp.text}
      disabled={!isEditor}
      data-fs-element="Check request target select"
      htmlFor={id}
    >
      <div className={styles.stack}>
        <Controller
          control={control}
          render={({ field }) => {
            const { ref, onChange, ...rest } = field;
            return (
              <div>
                <Select
                  {...rest}
                  options={METHOD_OPTIONS}
                  aria-label={ariaLabel}
                  onChange={({ value }) => onChange(value)}
                />
              </div>
            );
          }}
          name={methodName}
        />
        <Field className={styles.field} invalid={Boolean(targetFieldError)} error={targetFieldError}>
          <Input
            aria-label={ariaLabel}
            id={id}
            data-fs-element="Target input"
            placeholder={showPlaceholder ? targetHelp.example : ``}
            onFocus={() => setShowplaceholder(false)}
            {...targetField}
            onBlur={(e) => {
              setShowplaceholder(true);
              targetField.onBlur(e);
            }}
          />
        </Field>
      </div>
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    display: `grid`,
    gridTemplateColumns: `110px 1fr`,
  }),
  field: css({
    margin: 0,
  }),
});

const getTargetHelpText = (typeOfCheck: CheckType | undefined) => {
  if (!typeOfCheck) {
    return { text: '', example: '' };
  }
  let resp;
  switch (typeOfCheck) {
    case CheckType.HTTP: {
      resp = {
        text: 'Full URL to send requests to',
        example: 'https://grafana.com/',
      };
      break;
    }
    case CheckType.MULTI_HTTP: {
      resp = {
        text: 'Full URL to send requests to, one part of multihttp',
        example: `https://grafana.com/`,
      };
      break;
    }
    case CheckType.PING: {
      resp = {
        text: 'Hostname to ping',
        example: 'grafana.com',
      };
      break;
    }
    case CheckType.DNS: {
      resp = {
        text: 'Name of record to query',
        example: 'grafana.com',
      };
      break;
    }
    case CheckType.TCP: {
      resp = {
        text: 'Host:port to connect to',
        example: 'grafana.com:80',
      };
      break;
    }
    case CheckType.Traceroute: {
      resp = {
        text: 'Hostname to send traceroute',
        example: 'grafana.com',
      };
      break;
    }
    case CheckType.Scripted: {
      resp = {
        text: 'The URL that best describes the target of the check',
        example: `https://grafana.com/`,
      };
      break;
    }

    case CheckType.GRPC: {
      resp = {
        text: 'Host:port to connect to',
        example: 'grafana.com:50051',
      };
      break;
    }
  }
  return resp;
};
