import React, { FC } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Field, Input, IconButton, HorizontalGroup, Icon, Button } from '@grafana/ui';

interface Props {
  isEditor: boolean;
  name: string;
  label: string;
  description: string;
}

export const BodyRegexMatcherInput: FC<Props> = ({ isEditor, name, label, description }) => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <Field label={label} description={description} disabled={!isEditor}>
      <div>
        {fields.map((field, index) => (
          <HorizontalGroup key={field.id}>
            <Input ref={register()} type="text" name={`${name}[${index}]`} placeholder="regexp" disabled={!isEditor} />
            <IconButton name="minus-circle" type="button" disabled={!isEditor} onClick={() => remove(index)} />
          </HorizontalGroup>
        ))}
        <Button type="button" onClick={() => append({ value: '' })} disabled={!isEditor} variant="secondary" size="sm">
          <Icon name="plus" />
          &nbsp; Add Body Regexp
        </Button>
      </div>
    </Field>
  );
};
