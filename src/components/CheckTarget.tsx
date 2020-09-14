import React, { FC, ChangeEvent } from 'react';
import { Field, Input } from '@grafana/ui';
import { css } from 'emotion';
import { CheckType, Settings } from 'types';
import { parseUrl } from 'utils';
import QueryParams from './QueryParams';

interface Props {
  target: string;
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
  }
  return resp;
};

const CheckTarget: FC<Props> = ({ target, typeOfCheck, disabled, onChange, onBlur, invalid, error }) => {
  const targetHelp = getTargetHelpText(typeOfCheck);
  const parsedURL = parseUrl(target);
  return (
    <>
      <Field label="Target" description={targetHelp.text} disabled={disabled} invalid={invalid} error={error}>
        <Input
          type="string"
          onBlur={onBlur}
          placeholder={targetHelp.example}
          value={target}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
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
};

export default CheckTarget;
