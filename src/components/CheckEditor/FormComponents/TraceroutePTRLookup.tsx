import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValuesTraceroute } from 'types';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const TraceroutePTRLookup = ({ disabled }: { disabled?: boolean }) => {
  const { register } = useFormContext<CheckFormValuesTraceroute>();

  return (
    <HorizontalCheckboxField
      {...register('settings.traceroute.ptrLookup')}
      data-fs-element="PTR lookup checkbox"
      description="Reverse lookup hostnames from IP addresses"
      disabled={disabled}
      id="traceroute-settings-ptr-lookup"
      label="PTR lookup"
    />
  );
};
