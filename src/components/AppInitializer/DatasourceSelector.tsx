import React, { forwardRef, useState } from 'react';
import { SelectableValue } from '@grafana/data';
import { Alert, Field, Select, Text } from '@grafana/ui';

interface DatasourceSelectorProps {
  formError?: string;
  globalError?: Error;
  onChange: (value: string) => void;
  options: SelectableValue[];
  value?: string;
  title: string;
}

export const DatasourceSelector = forwardRef<HTMLInputElement, DatasourceSelectorProps>(
  ({ formError, globalError, onChange, options, value, title }, ref) => {
    const [showGlobalError, setShowGlobalError] = useState(Boolean(globalError));

    return (
      <div>
        <Text>{title}</Text>
        <Field label={`Select a datasource`} invalid={Boolean(formError)} error={formError}>
          <Select
            options={options.map(({ name, uid }) => ({
              value: uid,
              label: name,
            }))}
            onChange={({ value }) => {
              onChange(value);
              setShowGlobalError(false);
            }}
            value={value}
            ref={ref}
          />
        </Field>
        {showGlobalError && globalError && (
          <Alert title={globalError.name} severity={`error`}>
            {globalError.message}
          </Alert>
        )}
      </div>
    );
  }
);

DatasourceSelector.displayName = `DatasourceSelector`;
