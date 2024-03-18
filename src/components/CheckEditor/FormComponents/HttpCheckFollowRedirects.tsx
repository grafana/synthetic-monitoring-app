import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const HttpCheckFollowRedirects = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      id="http-settings-followRedirects"
      label="Follow redirects"
      disabled={!isEditor}
      {...register('settings.http.followRedirects')}
    />
  );
};
