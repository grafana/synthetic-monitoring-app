import React from 'react';
import { css } from '@emotion/css';
import { UseFormRegister, useFieldArray, useFormContext, FieldValues } from 'react-hook-form';

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
import { validateHTTPBody, validateHTTPHeaderValue } from 'validation';

interface Props {
  isEditor?: boolean;
  register: UseFormRegister<FieldValues>;
  label?: string;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
}

interface RequestTabsProps {
  isEditor?: boolean;
  register: UseFormRegister<FieldValues>;
  label?: string;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
  activeTab: string;
  onChange: (tab: string) => void;
}

export const HeadersTab = ({
  control,
  isEditor,
  register,
  unregister,
  trigger,
  label = 'header',
  errors,
  index,
}: Props) => {
  const { fields, append, remove } = useFieldArray({ name, control });
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Request headers" description="The HTTP headers set for the probe." disabled={!isEditor}>
            <>
              {fields.map((field, i) => (
                <>
                  <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                    <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                      <Input
                        {...register(`settings.multihttp.entries[${index}].request.headers[${i}].name` as const, {
                          required: true,
                          // validate: (val) => validateHTTPHeaderName(val),
                        })}
                        type="text"
                        placeholder="name"
                        disabled={!isEditor}
                        onMouseLeave={() =>
                          trigger(`settings.multihttp.entries[${index}].request.headers[${i}].name`, {
                            shouldFocus: true,
                            shouldUnregister: true,
                          })
                        }
                      />
                      {/* TODO: FIX SELECT COMPONENT  */}
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
                              value={value ?? undefined}
                              placeholder="header name"
                            />
                          );
                        }}
                        rules={{ required: true }}
                        name={`settings.multihttp.entries[${index}].request.headers[${index}].name` as const}
                      />
                    </Field> */}

                      <Input
                        {...register(`settings.multihttp.entries[${index}].request.headers[${i}].value` as const, {
                          required: true,
                          minLength: 1,
                          validate: validateHTTPHeaderValue,
                        })}
                        type="text"
                        placeholder="value"
                        disabled={!isEditor}
                        onMouseLeave={() =>
                          trigger(`settings.multihttp.entries[${index}].request.headers[${i}].value`, {
                            shouldFocus: true,
                            shouldUnregister: true,
                          })
                        }
                      />
                    </HorizontalGroup>
                    <IconButton
                      className={styles.removeIcon}
                      name="minus-circle"
                      type="button"
                      onClick={() => {
                        remove(i);
                        unregister([`settings.multihttp.entries[${index}].request.headers[${i}]`]);
                      }}
                    />
                  </HorizontalGroup>
                  {(errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.name ||
                    errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.value) && (
                    <>
                      <div style={{ color: 'red' }}>Enter at least one character</div>
                      <br />
                    </>
                  )}
                </>
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

export const BodyTab = ({ index, isEditor, errors, register }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
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
    </div>
  );
};

const QueryParamsTab = ({ register, unregister, index, errors }: Props) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Query params">
            <>
              {fields.map((field, i) => (
                <>
                  <HorizontalGroup key={field.id} align="flex-start" spacing="md">
                    <HorizontalGroup key={field.id} spacing="md" align="center">
                      <Input
                        {...register(`settings.multihttp.entries[${index}].request.queryString[${i}].name` as const, {
                          required: true,
                        })}
                        type="text"
                        placeholder="Parameter name"
                      />
                      <Input
                        {...register(`settings.multihttp.entries[${index}].request.queryString[${i}].value` as const, {
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
                      onClick={() => {
                        remove(i);
                        unregister([`settings.multihttp.entries[${index}].request.queryString[${i}]`]);
                      }}
                    />
                  </HorizontalGroup>
                  {(errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.name ||
                    errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.value) && (
                    <>
                      <div style={{ color: 'red' }}>Enter at least one character</div>
                      <br />
                    </>
                  )}
                </>
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
    </div>
  );
};

export const RequestTabs = ({
  activeTab,
  isEditor,
  errors,
  register,
  unregister,
  index,
  onChange,
  control,
  trigger,
}: RequestTabsProps) => {
  switch (activeTab) {
    case 'header':
      onChange('header');
      return (
        <HeadersTab
          unregister={unregister}
          trigger={trigger}
          control={control}
          isEditor={isEditor}
          register={register}
          label="header"
          index={index}
          errors={errors}
        />
      );
    case 'body':
      onChange('body');
      return <BodyTab isEditor={isEditor} index={index} errors={errors} register={register} />;
    case 'queryParams':
      onChange('queryParams');
      return <QueryParamsTab register={register} index={index} unregister={unregister} />;
    default:
      onChange('header');
      return (
        <HeadersTab
          unregister={unregister}
          trigger={trigger}
          control={control}
          isEditor={isEditor}
          register={register}
          label="header"
          index={index}
          errors={errors}
        />
      );
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
