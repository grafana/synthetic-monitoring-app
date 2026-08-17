import React from 'react';

import { CheckFormFieldPath } from '../../types';

import { FormSecretOrPlaintextField } from './FormSecretOrPlaintextField';

interface FormHttpBearerTokenFieldProps {
  field: CheckFormFieldPath;
}

export function FormHttpBearerTokenField({ field }: FormHttpBearerTokenFieldProps) {
  return <FormSecretOrPlaintextField field={field} label="Token" required variant="password" allowSecrets />;
}
