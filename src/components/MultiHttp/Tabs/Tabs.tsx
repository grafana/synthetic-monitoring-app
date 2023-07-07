import { css } from '@emotion/css';
import React, { Fragment } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Container,
  Field,
  HorizontalGroup,
  Icon,
  IconButton,
  Input,
  Select,
  TextArea,
  VerticalGroup,
  useStyles2,
} from '@grafana/ui';
import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from 'components/constants';
import { MultiHttpFormTabs, MultiHttpVariableType } from 'types';
import { AssertionsTab } from './AssertionsTab';

export interface MultiHttpTabProps {
  label?: string;
  index: number;
  activeTab?: MultiHttpFormTabs;
}

interface RequestTabsProps {
  index: number;
  activeTab: MultiHttpFormTabs;
}

export const HeadersTab = ({ label = 'header', index }: MultiHttpTabProps) => {
  const { control, register, unregister, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: `settings.multihttp.entries[${index}].request.headers`,
    control,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Request headers" description="The HTTP headers set for the probe.">
            <>
              {fields.map((field, i) => {
                const headersNamePrefix = `settings.multihttp.entries[${index}].request.headers[${i}]`;

                return (
                  <Fragment key={field.id}>
                    <HorizontalGroup spacing="md" align="center" className={styles.headersQueryInputs}>
                      <HorizontalGroup spacing="md" align="center" className={styles.headersQueryInputs}>
                        <Field
                          invalid={formState.errors?.settings?.multihttp?.entries[index]?.request?.headers?.[i]?.name}
                          error={
                            formState.errors?.settings?.multihttp?.entries[index]?.request?.headers?.[i]?.name?.message
                          }
                        >
                          <Input
                            {...register(`${headersNamePrefix}.name` as const, {
                              required: 'Header name required',
                              minLength: 1,
                            })}
                            type="text"
                            placeholder="name"
                            data-testid={`header-name-${index}`}
                          />
                        </Field>
                        <Field
                          invalid={formState.errors?.settings?.multihttp?.entries[index]?.request?.headers?.[i]?.value}
                          error={
                            formState.errors?.settings?.multihttp?.entries[index]?.request?.headers?.[i]?.value?.message
                          }
                        >
                          <Input
                            {...register(`${headersNamePrefix}.value` as const, {
                              required: 'Header value required',
                              minLength: 1,
                            })}
                            type="text"
                            data-testid={`header-value-${index}`}
                            placeholder="value"
                          />
                        </Field>
                      </HorizontalGroup>
                      <IconButton
                        className={styles.removeIcon}
                        name="minus-circle"
                        type="button"
                        onClick={() => {
                          remove(i);
                          unregister([`${headersNamePrefix}`]);
                        }}
                      />
                    </HorizontalGroup>
                    {/* {(formState.errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.name ||
                      formState.errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.value) && (
                      <>
                        <div className={styles.errorMsg}>Enter at least one character</div>
                        <br />
                      </>
                    )} */}
                  </Fragment>
                );
              })}
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

export const BodyTab = ({ index }: MultiHttpTabProps) => {
  const styles = useStyles2(getMultiHttpTabStyles);
  const { formState, register } = useFormContext();

  return (
    <div className={styles.inputsContainer} data-testid="body-tab">
      <Field
        label="Request body"
        description="The body of the HTTP request used in probe."
        invalid={Boolean(formState?.errors?.settings?.http?.body?.message)}
        error={formState.errors?.settings?.http?.body?.message}
      >
        <TextArea
          {...register(`settings.multihttp.entries[${index}].request.body` as const)}
          rows={2}
          id={`request-body-${index}`}
        />
      </Field>
    </div>
  );
};

const QueryParamsTab = ({ index, label }: MultiHttpTabProps) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `settings.multihttp.entries[${index}].request.queryString`,
  });
  const styles = useStyles2(getMultiHttpTabStyles);
  const { register, formState } = useFormContext();
  const errors = formState.errors?.settings?.multihttp?.entries?.[index]?.request?.queryString;

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Query params">
            <>
              {fields.map((field, i) => {
                const queryParamsNamePrefix = `settings.multihttp.entries[${index}].request.queryString[${i}]`;

                return (
                  <Fragment key={field.id}>
                    <HorizontalGroup align="flex-start" spacing="md">
                      <HorizontalGroup spacing="md" align="center">
                        <Field invalid={errors?.[i]?.name} error={errors?.[i]?.name?.message}>
                          <Input
                            {...register(`${queryParamsNamePrefix}.name` as const, {
                              required: 'Query param name required',
                              minLength: 1,
                            })}
                            type="text"
                            placeholder="Parameter name"
                            data-testid="query-param-name"
                          />
                        </Field>
                        <Field invalid={errors?.[i]?.value} error={errors?.[i]?.value?.message}>
                          <Input
                            {...register(`${queryParamsNamePrefix}.value` as const, {
                              required: 'Query param value required',
                              minLength: 1,
                            })}
                            type="text"
                            placeholder="Parameter value"
                            data-testid="query-param-value"
                          />
                        </Field>
                      </HorizontalGroup>
                      <IconButton
                        className={styles.removeIcon}
                        name="minus-circle"
                        type="button"
                        onClick={() => {
                          remove(i);
                        }}
                      />
                    </HorizontalGroup>
                  </Fragment>
                );
              })}
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

const VariablesTab = ({ index }: MultiHttpTabProps) => {
  const variableFieldName = `settings.multihttp.entries[${index}].variables`;
  const { control, register, watch, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: variableFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={styles.inputsContainer}>
      {fields.map((field, variableIndex) => {
        const variableTypeName = `${variableFieldName}[${variableIndex}].type` ?? '';
        const variableTypeValue = watch(variableTypeName)?.value;
        const errorPath = formState.errors.settings?.multihttp?.entries[index]?.variables?.[variableIndex];

        return (
          <HorizontalGroup key={field.id}>
            <Controller
              name={variableTypeName}
              render={({ field: typeField }) => {
                return (
                  <Field label="Variable type" invalid={errorPath?.type}>
                    <Select
                      id={`multihttp-variable-type-${index}-${variableIndex}`}
                      className={styles.minInputWidth}
                      {...typeField}
                      options={MULTI_HTTP_VARIABLE_TYPE_OPTIONS}
                      menuPlacement="bottom"
                    />
                  </Field>
                );
              }}
              rules={{ required: true }}
            />
            <Field label="Variable name" invalid={errorPath?.name} error={errorPath?.name?.message}>
              <Input
                placeholder="Variable name"
                id={`multihttp-variable-name-${index}-${variableIndex}`}
                invalid={formState.errors.settings?.multihttp?.entries[index]?.variables[variableIndex]?.type}
                {...register(`${variableFieldName}[${variableIndex}].name`, { required: 'Variable name is required' })}
              />
            </Field>
            {variableTypeValue === MultiHttpVariableType.CSS_SELECTOR && (
              <Field label="Attribute" invalid={errorPath?.attribute} error={errorPath?.attribute?.message}>
                <Input
                  placeholder="Attribute"
                  id={`multihttp-variable-attribute-${index}-${variableIndex}`}
                  {...register(`${variableFieldName}[${variableIndex}].attribute`, {
                    required: 'Attribute is required',
                  })}
                />
              </Field>
            )}
            <Field label="Variable expression" invalid={errorPath?.expression} error={errorPath?.expression.message}>
              <Input
                placeholder="Variable expression"
                id={`multihttp-variable-expression-${index}-${variableIndex}`}
                {...register(`${variableFieldName}[${variableIndex}].expression`, {
                  required: 'Expression is required',
                })}
              />
            </Field>
            <IconButton name="trash-alt" onClick={() => remove(variableIndex)} />
          </HorizontalGroup>
        );
      })}
      <Button
        onClick={() => {
          append({ type: undefined, name: '', expression: '' });
        }}
        variant="secondary"
        size="sm"
        type="button"
        className={styles.addHeaderQueryButton}
      >
        <Icon name="plus" />
        &nbsp; Add variable
      </Button>
    </div>
  );
};

export const RequestTabs = ({ activeTab, index }: RequestTabsProps) => {
  switch (activeTab) {
    case 'header':
      return <HeadersTab label="header" index={index} />;
    case 'body':
      return <BodyTab index={index} />;
    case 'queryParams':
      return <QueryParamsTab index={index} label="queryParams" />;
    case 'variables':
      return <VariablesTab index={index} label="variables" />;
    case 'assertions':
      return <AssertionsTab index={index} label="assertions" />;
    default:
      return <HeadersTab label="header" index={index} />;
  }
};

export const getMultiHttpTabStyles = (theme: GrafanaTheme2) => ({
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
  errorMsg: css`
    color: ${theme.colors.error.text};
  `,
  minInputWidth: css`
    min-width: 200px;
  `,
});
