import React from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { hasRole } from 'utils';
import { IP_OPTIONS } from 'components/constants';

type CheckIpVersionProps = {
  checkType: CheckType.HTTP | CheckType.PING | CheckType.DNS | CheckType.TCP | CheckType.GRPC;
  name: FieldPath<CheckFormValues>;
};

const requestMap = {
  [CheckType.HTTP]: `HTTP`,
  [CheckType.PING]: `ICMP`,
  [CheckType.DNS]: `ICMP`,
  [CheckType.TCP]: `TCP`,
  [CheckType.GRPC]: `GRPC`,
};

export const CheckIpVersion = ({ checkType, name }: CheckIpVersionProps) => {
  const { control } = useFormContext<CheckFormValues>();
  const isEditor = hasRole(OrgRole.Editor);
  const id = `${checkType}-ip-version`;

  return (
    <Field
      label="IP version"
      description={`The IP protocol of the ${requestMap[checkType]} request`}
      disabled={!isEditor}
      htmlFor={id}
      data-fs-element="IP version select"
    >
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              options={IP_OPTIONS}
              inputId={id}
              value={rest.value}
              onChange={({ value }) => {
                onChange(value);
              }}
            />
          );
        }}
        name={name}
      />
    </Field>
  );
};
