import React, { FC, useState, useEffect, ChangeEvent } from 'react';
import { Field, Input } from '@grafana/ui';
import { css } from 'emotion';
import { validateTarget } from 'validation';
import { CheckType, Settings } from 'types';
import { checkType, parseUrl } from 'utils';
import QueryParams from './QueryParams';

interface Props {
  target: string;
  typeOfCheck?: CheckType;
  checkSettings: Settings;
  disabled?: boolean;
  onChange: (target: string) => void;
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

const CheckTarget: FC<Props> = ({ target, typeOfCheck, disabled, checkSettings, onChange }) => {
  const targetHelp = getTargetHelpText(typeOfCheck);
  const [targetValue, updateTarget] = useState(target);

  useEffect(() => {
    onChange(targetValue);
  }, [targetValue]);

  const parsedURL = parseUrl(targetValue);
  return (
    <>
      <Field
        label="Target"
        description={targetHelp.text}
        disabled={disabled}
        invalid={!validateTarget(checkType(checkSettings), target)}
      >
        <Input
          type="string"
          placeholder={targetHelp.example}
          value={target}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateTarget(e.target.value)}
          required={true}
        />
      </Field>
      {typeOfCheck === CheckType.HTTP && parsedURL && (
        <QueryParams
          target={parsedURL}
          onChange={(target: string) => updateTarget(target)}
          className={css`
            padding-left: 1rem;
          `}
        />
      )}
    </>
  );
};

export default CheckTarget;
