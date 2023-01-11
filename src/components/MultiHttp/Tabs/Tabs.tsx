import React from 'react';
import { UseFormRegister, useFieldArray, useFormContext, FieldValues } from 'react-hook-form';
import validUrl from 'valid-url';

import { Button, Container, Field, HorizontalGroup, Icon, IconButton, TextArea, VerticalGroup } from '@grafana/ui';
import { validateHTTPBody, validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';

export const HeadersTab = ({
  isEditor,
  register,
  label = 'header',
}: {
  isEditor: boolean;
  register: UseFormRegister<FieldValues>;
  label: string;
}) => {
  const {
    // register,
    control,
    // formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <VerticalGroup justify="space-between">
      <Container>
        {fields.map((field, index) => (
          <HorizontalGroup key={field.id} align="flex-start">
            <Field label="Request headers" description="The HTTP headers set for the probe." disabled={!isEditor}>
              <>
                <input
                  {...register(`settings.multihttp.entries[${index}].request.headers[${index}].name` as const, {
                    required: true,
                    validate: validateHTTPHeaderName,
                  })}
                  type="text"
                  placeholder="name"
                  disabled={!isEditor}
                />
                <input
                  {...register(`settings.multihttp.entries[${index}].request.headers[${index}].value` as const, {
                    required: true,
                    validate: validateHTTPHeaderValue,
                  })}
                  type="text"
                  placeholder="value"
                  disabled={!isEditor}
                />
              </>
            </Field>
            <IconButton
              // className={css`
              //   margin-top: ${theme.spacing.sm};
              // `}
              name="minus-circle"
              type="button"
              onClick={() => remove(index)}
            />
          </HorizontalGroup>
        ))}
        <Button
          onClick={() => append({ name: '', value: '' })}
          // disabled={disabled}
          variant="secondary"
          size="sm"
          type="button"
        >
          <Icon name="plus" />
          &nbsp; Add {label}
        </Button>
      </Container>
    </VerticalGroup>
  );
};

export const BodyTab = ({
  index,
  isEditor,
  errors,
  register,
}: {
  index: string;
  isEditor: boolean;
  errors: any;
  register: UseFormRegister<FieldValues>;
}) => {
  return (
    <Field
      label="Request body"
      description="The body of the HTTP request used in probe."
      disabled={!isEditor}
      invalid={Boolean(errors?.settings?.http?.body)}
      error={errors?.settings?.http?.body}
    >
      <TextArea
        {...register(`settings.multihttp.entries[${index}].request.body`, { validate: validateHTTPBody })}
        rows={2}
        disabled={!isEditor}
      />
    </Field>
  );
};

const QueryParamsTab = ({ register }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <VerticalGroup justify="space-between">
      <Container>
        {fields.map((field, index) => (
          <HorizontalGroup key={field.id} align="flex-start">
            <Field label="Query params">
              <>
                <input
                  {...register(`settings.multihttp.entries[${index}].request.queryString[${index}].name` as const, {
                    required: true,
                  })}
                  type="text"
                  placeholder="Parameter name"
                />
                <input
                  {...register(`settings.multihttp.entries[${index}].request.queryString[${index}].value` as const, {
                    required: true,
                  })}
                  type="text"
                  placeholder="Parameter value"
                />
              </>
            </Field>
            <IconButton
              // className={css`
              //   margin-top: ${theme.spacing.sm};
              // `}
              name="minus-circle"
              type="button"
              onClick={() => remove(index)}
            />
          </HorizontalGroup>
        ))}
        <Button onClick={() => append({ name: '', value: '' })} variant="secondary" size="sm" type="button">
          <Icon name="plus" />
          &nbsp; Add query param
        </Button>
      </Container>
    </VerticalGroup>
  );
};

export const RequestTabs = ({ activeTab, isEditor, errors, register, value, index, onChange }) => {
  switch (activeTab) {
    case 'header':
      onChange('header');
      return <HeadersTab isEditor={isEditor} register={register} label="header" />;
    case 'body':
      onChange('body');
      return <BodyTab isEditor={isEditor} index={index} errors={errors} register={register} />;
    case 'queryParams':
      onChange('queryParams');
      return <QueryParamsTab register={register} />;
    default:
      onChange('header');
      return <HeadersTab isEditor={isEditor} register={register} label="header" />;
  }
};
