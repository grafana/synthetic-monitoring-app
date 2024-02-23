import React, { ChangeEvent, forwardRef } from 'react';
import { Field, Input } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { parseUrl } from 'utils';

import QueryParams from './QueryParams';

interface Props {
  value: string;
  typeOfCheck?: CheckType;
  disabled?: boolean;
  onChange: (target: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  error?: string;
}

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

const CheckTarget = forwardRef(
  ({ value, typeOfCheck, disabled, onChange, onBlur, invalid, error }: Props, ref: React.Ref<HTMLInputElement>) => {
    const targetHelp = getTargetHelpText(typeOfCheck);
    const parsedURL = parseUrl(value);

    return (
      <>
        <Field
          label="Target"
          description={targetHelp?.text}
          disabled={disabled}
          invalid={invalid}
          error={error}
          required
        >
          <Input
            id="check-editor-target"
            data-testid="check-editor-target"
            ref={ref}
            type="text"
            onBlur={onBlur}
            placeholder={targetHelp?.example}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              onChange(e.target.value);
            }}
            required={true}
          />
        </Field>
        {typeOfCheck === CheckType.HTTP && parsedURL && (
          <QueryParams
            target={parsedURL}
            onBlur={onBlur}
            onChange={(target: string) => onChange(target)}
            className={css`
              padding-left: 1rem;
              margin-bottom: 1rem;
            `}
          />
        )}
      </>
    );
  }
);

CheckTarget.displayName = 'CheckTarget';

export default CheckTarget;
