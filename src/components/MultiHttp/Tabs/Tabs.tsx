import React from 'react';
import { css } from '@emotion/css';
import { UseFormRegister, useFieldArray, useFormContext, FieldValues } from 'react-hook-form';
import validUrl from 'valid-url';

import { parseUrl } from 'utils';
import { Button, Container, Field, HorizontalGroup, Icon, IconButton, TextArea, VerticalGroup } from '@grafana/ui';
import { validateHTTPBody, validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';
import QueryParams from 'components/QueryParams';

export const HeadersTab = ({
  index,
  isEditor,
  register,
  label = 'header',
}: {
  index: string;
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
  label = 'body',
}: {
  index: string;
  isEditor: boolean;
  errors: any;
  register: UseFormRegister<FieldValues>;
  label: string;
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

const QueryParamsTab = ({ value, onChange, index, register }) => {
  const parsedURL = parseUrl(value);

  return (
    <QueryParams
      {...register(`settings.multihttp.entries[${index}].request.queryString`)}
      target={parsedURL || value}
      onChange={(target: string) => onChange(target)}
      className={css`
        padding-left: 1rem;
        margin-bottom: 1rem;
      `}
    />
  );
};

export const RequestTabs = ({
  activeTab,
  isEditor,
  errors,
  register,
  // field,
  selectCheckType,
  formMethods,
  value,
  onChange,
  index,
  label,
  // onBlur,
}) => {
  const httpEncoded = encodeURI(value);
  const isValidUrl = Boolean(validUrl.isWebUri(httpEncoded));

  switch (activeTab) {
    case 'header':
      return <HeadersTab isEditor={isEditor} index={index} register={register} label="header" />;
    case 'body':
      return <BodyTab isEditor={isEditor} index={index} errors={errors} register={register} label="body" />;
    case 'queryParams':
      return isValidUrl ? (
        <QueryParamsTab
          {...register(`settings.multihttp.entries[${index}].request.queryString`)}
          value={parseUrl(value)}
          onChange={onChange}
          index={index}
          register={register}
        />
      ) : (
        <HeadersTab isEditor={isEditor} index={index} register={register} label="header" />
      );
    default:
      return <HeadersTab isEditor={isEditor} index={index} register={register} label="header" />;
  }
};
