import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Switch } from '@grafana/ui';

import {TLSCheckTypes, TLSFormValues} from 'types';
import { hasRole } from 'utils';

export const CheckUseTLS = ({checkType}: {checkType: TLSCheckTypes}) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<TLSFormValues>();
  const id = `${checkType}-settings-use-tls`;

  return (
    <Field
      label="Use TLS"
      description="Whether or not TLS is used when the connection is initiated."
      disabled={!isEditor}
      htmlFor={id}
    >
      <Switch
        {...register(`settings.${checkType}.tls`)}
        title="Use TLS"
        disabled={!isEditor}
        id={id}
        data-fs-element="Use TLS switch"
      />
    </Field>
  );
};
