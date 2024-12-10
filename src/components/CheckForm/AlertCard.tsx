import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Card, Field, Icon, Input } from '@grafana/ui';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from './CheckFormContext/CheckFormContext';

interface AlertCardProps {
  predefinedAlert: { type: CheckAlertType; description: string };
  onSelect: (type: CheckAlertType, forceSelection?: boolean) => void;
}

export const AlertCard = ({ predefinedAlert, onSelect }: AlertCardProps) => {
  const { control, formState, getValues } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  const thresholdError = formState.errors?.alerts?.[predefinedAlert.type]?.threshold?.message;

  const isSelected: boolean = getValues(`alerts.${predefinedAlert.type}.isSelected`) || false;
  const threshold: number = getValues(`alerts.${predefinedAlert.type}.threshold`) || 0;

  return (
    <Card
      key={predefinedAlert.type}
      isSelected={isSelected}
      disabled={isFormDisabled}
      onClick={() => {
        onSelect(predefinedAlert.type);
      }}
    >
      <Card.Figure>
        <Icon name="bell" size="xxl" />
      </Card.Figure>
      <Card.Heading>{predefinedAlert.type}</Card.Heading>
      <Card.Description>
        <div>{predefinedAlert.description}</div>
      </Card.Description>
      <Card.Actions>
        <Field
          label="Threshold"
          htmlFor={`alert-threshold-${predefinedAlert.type}`}
          invalid={Boolean(thresholdError)}
          error={thresholdError}
        >
          <Controller
            name={`alerts.${predefinedAlert.type}.threshold`}
            control={control}
            render={({ field }) => {
              return (
                <Input
                  type="number"
                  id={`alert-threshold-${predefinedAlert.type}`}
                  value={field.value ? field.value : threshold}
                  onChange={(e) => {
                    if (!isSelected) {
                      onSelect(predefinedAlert.type, true);
                    }
                    return field.onChange(+e.currentTarget.value);
                  }}
                  width={15}
                  disabled={isFormDisabled}
                />
              );
            }}
          />
        </Field>
      </Card.Actions>
    </Card>
  );
};
