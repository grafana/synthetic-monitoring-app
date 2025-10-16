import React from 'react';
import { useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { Combobox } from '@grafana/ui';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues, DnsRecordType } from 'types';
import { DNS_RECORD_TYPES } from 'components/constants';

import { StyledField } from '../ui/StyledField';

interface FormDnsRecordTypeFieldProps {
  field: CheckFormFieldPath;
}

export function FormDnsRecordTypeField({ field }: FormDnsRecordTypeFieldProps) {
  const {
    watch,
    register,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { onChange, onBlur: _onBlur, ...fieldProps } = register(field);

  const inputValue = watch(field) as DnsRecordType;

  const handleOnChange = ({ value }: SelectableValue<DnsRecordType>) => {
    onChange({ target: { value } });
  };

  return (
    <StyledField label="Record type">
      <Combobox
        value={inputValue}
        {...fieldProps}
        onChange={handleOnChange}
        disabled={disabled}
        options={DNS_RECORD_TYPES}
      />
    </StyledField>
  );
}
