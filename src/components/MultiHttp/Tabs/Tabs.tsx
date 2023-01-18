import React from 'react';
import { css } from '@emotion/css';
import {
  // Controller,
  UseFormRegister,
  useFieldArray,
  useFormContext,
  FieldValues,
} from 'react-hook-form';

import {
  Button,
  Container,
  Field,
  HorizontalGroup,
  Icon,
  IconButton,
  Input,
  // Select,
  TextArea,
  VerticalGroup,
  useStyles2,
} from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
// import { headerNameOptions } from 'components/constants';
// import { selectableValueFrom } from 'components/CheckEditor/checkFormTransformations';
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
    control,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Request headers" description="The HTTP headers set for the probe." disabled={!isEditor}>
            <>
              {fields.map((field, index) => (
                <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                  <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                    <Input
                      {...register(`settings.multihttp.entries[${index}].request.headers[${index}].name` as const, {
                        required: true,
                        validate: validateHTTPHeaderName,
                      })}
                      type="text"
                      placeholder="name"
                      disabled={!isEditor}
                    />
                    {/* <Field
                        label="Name"
                        disabled={!isEditor}
                        invalid={Boolean(errors?.settings?.http?.method)}
                        error={errors?.settings?.http?.method}
                      >
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => {
                            console.log('valuuuuuu', value);

                            return (
                              <Select
                                {...field}
                                options={headerNameOptions}
                                onChange={(val) => onChange(val.value)}
                                value={value}
                                placeholder="header name"
                              />
                            );
                          }}
                          rules={{ required: true }}
                          name={`settings.multihttp.entries[${index}].request.headers[${index}].name` as const}
                        />
                      </Field> */}

                    <Input
                      {...register(`settings.multihttp.entries[${index}].request.headers[${index}].value` as const, {
                        required: true,
                        validate: validateHTTPHeaderValue,
                      })}
                      type="text"
                      placeholder="value"
                      disabled={!isEditor}
                    />
                  </HorizontalGroup>
                  <IconButton
                    className={styles.removeIcon}
                    name="minus-circle"
                    type="button"
                    onClick={() => remove(index)}
                  />
                </HorizontalGroup>
              ))}
              <Button
                onClick={() => append({})}
                variant="secondary"
                size="sm"
                type="button"
                className={styles.addHeaderQueryButton}
              >
                <Icon name="plus" />
                &nbsp; Add {label}
              </Button>
            </>
          </Field>
        </Container>
      </VerticalGroup>
    </div>
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
  const styles = useStyles2(getStyles);

  return (
    <VerticalGroup justify="space-between">
      <Container>
        <Field label="Query params">
          <>
            {fields.map((field, index) => (
              <HorizontalGroup key={field.id} align="flex-start" spacing="md">
                <HorizontalGroup key={field.id} spacing="md" align="center">
                  <Input
                    {...register(`settings.multihttp.entries[${index}].request.queryString[${index}].name` as const, {
                      required: true,
                    })}
                    type="text"
                    placeholder="Parameter name"
                  />
                  <Input
                    {...register(`settings.multihttp.entries[${index}].request.queryString[${index}].value` as const, {
                      required: true,
                    })}
                    type="text"
                    placeholder="Parameter value"
                  />
                </HorizontalGroup>
                <IconButton
                  className={styles.removeIcon}
                  name="minus-circle"
                  type="button"
                  onClick={() => remove(index)}
                />
              </HorizontalGroup>
            ))}
            <Button
              onClick={() => append({})}
              variant="secondary"
              size="sm"
              type="button"
              className={styles.addHeaderQueryButton}
            >
              <Icon name="plus" />
              &nbsp; Add query param
            </Button>
          </>
        </Field>
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

const getStyles = (theme: GrafanaTheme2) => ({
  removeIcon: css`
    margin-top: 6px;
  `,
  headersQueryInputs: css`
    margin: 100px 0;
  `,
  addHeaderQueryButton: css`
    margin-top: 8px;
  `,
  inputsContainer: css`
    padding: 12px;
  `,
});
