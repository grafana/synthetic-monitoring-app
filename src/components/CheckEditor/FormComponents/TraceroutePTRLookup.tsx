import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { CheckFormValuesTraceroute } from 'types';
import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const TraceroutePTRLookup = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValuesTraceroute>();

  return (
    <HorizontalCheckboxField
      id="traceroute-settings-ptr-lookup"
      label="PTR lookup"
      description="Reverse lookup hostnames from IP addresses"
      disabled={!isEditor}
      {...register('settings.traceroute.ptrLookup')}
      data-fs-element="PTR lookup checkbox"
    />
  );
};
