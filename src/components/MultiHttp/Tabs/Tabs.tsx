import React from 'react';
import { css } from '@emotion/css';
import { UseFormRegister, FieldValues } from 'react-hook-form';
import validUrl from 'valid-url';

import { parseUrl } from 'utils';
import { Container, Field, TextArea } from '@grafana/ui';
import { validateHTTPBody, validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';
import QueryParams from 'components/QueryParams';

export const HeadersTab = ({
  index,
  isEditor,
  register,
}: {
  index: string;
  isEditor: boolean;
  register: UseFormRegister<FieldValues>;
}) => {
  return (
    <Container>
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
    </Container>
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
      // invalid={Boolean(errors?.settings?.http?.body)}
      // error={errors?.settings?.http?.body}
    >
      <TextArea
        {...register(`settings.multihttp.entries[${index}].request.body`, { validate: validateHTTPBody })}
        rows={2}
        disabled={!isEditor}
      />
    </Field>
  );
};

const QueryParamsTab = ({ selectedCheckType, formMethods, isEditor, value, onChange }) => {
  return (
    <QueryParams
      target={value}
      onChange={(target: string) => onChange(target)}
      className={css`
        padding-left: 1rem;
        margin-bottom: 1rem;
      `}
      selectedCheckType={selectedCheckType}
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
}) => {
  const httpEncoded = encodeURI(value);
  const isValidUrl = Boolean(validUrl.isWebUri(httpEncoded));
  switch (activeTab) {
    case 'headers':
      return <HeadersTab isEditor={isEditor} index={index} register={register} />;
    case 'body':
      return <BodyTab isEditor={isEditor} index={index} errors={errors} register={register} />;
    case 'queryParams':
      return isValidUrl ? (
        <QueryParamsTab
          selectedCheckType={selectCheckType}
          formMethods={formMethods}
          isEditor
          value={parseUrl(value)}
          onChange={onChange}
          // onBlur={onBlur}
        />
      ) : (
        <HeadersTab isEditor={isEditor} index={index} register={register} />
      );
    default:
      return <HeadersTab isEditor={isEditor} index={index} register={register} />;
  }
};
