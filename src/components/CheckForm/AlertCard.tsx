import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Card, Field, Icon, Input, MultiSelect } from '@grafana/ui';

import { AlertPercentiles, CheckAlertFormType, CheckFormValues } from 'types';

import { useCheckFormContext } from './CheckFormContext/CheckFormContext';

interface AlertCardProps {
  predefinedAlert: { type: CheckAlertFormType; description: string; percentileOptions: AlertPercentiles[] };
  onSelect: (type: CheckAlertFormType, forceSelection?: boolean) => void;
}

export const AlertCard = ({ predefinedAlert, onSelect }: AlertCardProps) => {
  const { control, formState, getValues } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  const thresholdError = formState.errors?.alerts?.[predefinedAlert.type]?.threshold?.message;
  const percentileError = formState.errors?.alerts?.[predefinedAlert.type]?.percentiles?.message;

  const percentileOptions = useMemo(
    () => predefinedAlert.percentileOptions.map((v) => ({ label: v, value: v })),
    [predefinedAlert.percentileOptions]
  );

  const isSelected: boolean = getValues(`alerts.${predefinedAlert.type}.isSelected`) || false;
  const threshold: number = getValues(`alerts.${predefinedAlert.type}.threshold`) || 0;
  const percentiles: AlertPercentiles[] = getValues(`alerts.${predefinedAlert.type}.percentiles`) || [];

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
        {predefinedAlert.percentileOptions.length > 0 && (
          <Field
            label="Percentile"
            htmlFor={`alert-percentile-${predefinedAlert.type}`}
            invalid={Boolean(percentileError)}
            error={percentileError}
          >
            <Controller
              name={`alerts.${predefinedAlert.type}.percentiles`}
              control={control}
              render={({ field }) => {
                return (
                  <MultiSelect
                    disabled={isFormDisabled}
                    inputId={`alert-percentile-${predefinedAlert.type}`}
                    value={field.value ? field.value : percentiles}
                    onChange={(values) => {
                      if (!isSelected) {
                        onSelect(predefinedAlert.type, true);
                      }
                      return field.onChange(values.map((v) => v.value));
                    }}
                    options={percentileOptions}
                  />
                );
              }}
            />
          </Field>
        )}
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
