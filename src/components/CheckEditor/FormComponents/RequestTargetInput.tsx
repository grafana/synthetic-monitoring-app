import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { CheckFormValues, CheckType } from 'types';
import { parseUrl } from 'utils';
import { validateTarget } from 'validation';
import QueryParams from 'components/QueryParams';

type RequestMethodInputProps = {
  'aria-label'?: string;
  'data-testid'?: string;
  checkType: CheckType;
  id: string;
  name: any;
  showQueryParams?: boolean;
};

export const RequestTargetInput = ({
  'aria-label': ariaLabel,
  checkType,
  id,
  name,
  'data-testid': dataTestId,
  showQueryParams,
}: RequestMethodInputProps) => {
  const { control, formState, watch } = useFormContext<CheckFormValues>();
  const error = get(formState.errors, name);
  const styles = useStyles2(getStyles);
  const targetHelp = getTargetHelpText(checkType);
  const parsedURL = parseUrl(watch('target'));

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: { value: true, message: 'Target is required' },
        validate: (target) => {
          return validateTarget(checkType, target);
        },
      }}
      render={({ field }) => (
        <>
          <Field
            label="Request target"
            description={targetHelp?.text}
            invalid={Boolean(error)}
            error={error?.message}
            className={styles.requestTargetInput}
            htmlFor={id}
          >
            <Input
              aria-label={ariaLabel}
              id={id}
              data-testid={dataTestId}
              placeholder={targetHelp?.example}
              {...field}
            />
          </Field>
          {showQueryParams && parsedURL && (
            <QueryParams
              target={parsedURL}
              onBlur={field.onBlur}
              onChange={(target: string) => field.onChange(target)}
              className={css`
                padding-left: 1rem;
                margin-bottom: 1rem;
              `}
            />
          )}
        </>
      )}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  requestTargetInput: css({
    minWidth: theme.spacing(40),
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
  let resp: TargetHelpInfo;
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
    }
    case CheckType.GRPC: {
      resp = {
        text: '',
        example: '',
      };
    }
  }
  return resp;
};
