import React from 'react';
import { Controller } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckType } from 'types';
import { hasRole } from 'utils';
import { IP_OPTIONS } from 'components/constants';

type CheckIpVersionProps = {
  checkType: CheckType.HTTP | CheckType.PING | CheckType.DNS | CheckType.TCP;
  name: string;
};

const requestMap = {
  [CheckType.HTTP]: `HTTP`,
  [CheckType.PING]: `ICMP`,
  [CheckType.DNS]: `ICMP`,
  [CheckType.TCP]: `TCP`,
};

export const CheckIpVersion = ({ checkType, name }: CheckIpVersionProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const id = `${checkType}-ip-version`;

  return (
    <Field
      label="IP version"
      description={`The IP protocol of the ${requestMap[checkType]} request`}
      disabled={!isEditor}
      htmlFor={id}
    >
      <Controller
        render={({ field }) => {
          const { ref, ...rest } = field;
          return <Select {...rest} options={IP_OPTIONS} inputId={id} data-fs-element="IP version select" />;
        }}
        name={name}
      />
    </Field>
  );
};
