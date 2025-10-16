import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { AlertsPerCheck } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck';

// This is required for `AlertsPerCheck` to update values
// Revisit this when old check form has been removed
export function GenericAlertingField({ field }: { field: 'alerts' }) {
  const { watch } = useFormContext<CheckFormValues>();
  watch(field);

  return <AlertsPerCheck />;
}
