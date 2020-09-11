import React, { FC } from 'react';
import { HorizontalGroup, Input, IconButton, VerticalGroup, Icon, Button } from '@grafana/ui';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  limit: number;
  disabled?: boolean;
  label: string;
}

export const NameValueInput: FC<Props> = ({ name, disabled, limit, label }) => {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <VerticalGroup justify="space-between">
      {fields.map((field, index) => (
        <HorizontalGroup key={field.id}>
          <Input
            ref={register()}
            name={`${name}[${index}].name`}
            type="text"
            placeholder="name"
            disabled={disabled}
            // invalid={!Validation.validateLabelName(name)}
          />
          <Input
            ref={register()}
            name={`${name}[${index}].value`}
            type="text"
            placeholder="value"
            disabled={disabled}
            // invalid={!Validation.validateLabelValue(value)}
          />
          <IconButton name="minus-circle" type="button" onClick={() => remove(index)} disabled={disabled} />
        </HorizontalGroup>
      ))}
      {fields.length < limit && (
        <Button
          onClick={() => append({ name: '', value: '' })}
          disabled={disabled}
          variant="secondary"
          size="sm"
          type="button"
        >
          <Icon name="plus" />
          &nbsp; Add {label}
        </Button>
      )}
    </VerticalGroup>
  );
};
