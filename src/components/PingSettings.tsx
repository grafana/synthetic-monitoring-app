import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Switch } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesPing, CheckType } from 'types';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

import { CheckIpVersion } from './CheckEditor/FormComponents/CheckIpVersion';

interface Props {
  isEditor: boolean;
}

export const PingSettingsForm = ({ isEditor }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { register } = useFormContext<CheckFormValuesPing>();

  return (
    <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
      <div
        className={css`
          max-width: 500px;
        `}
      >
        <LabelField<CheckFormValuesPing> />
        <CheckIpVersion checkType={CheckType.PING} name="settings.ping.ipVersion" />
        <Field
          label="Don't fragment"
          description="Set the DF-bit in the IP-header. Only works with ipV4"
          disabled={!isEditor}
        >
          <Switch id="ping-settings-dont-fragment" {...register('settings.ping.dontFragment')} disabled={!isEditor} />
        </Field>
      </div>
    </Collapse>
  );
};
