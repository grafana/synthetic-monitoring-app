import { css, cx } from '@emotion/css';
import React from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Field,
  HorizontalGroup,
  Icon,
  IconButton,
  Input,
  Select,
  TabContent,
  TextArea,
  useStyles2,
} from '@grafana/ui';
import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from 'components/constants';
import { MultiHttpFormTabs, MultiHttpVariableType } from 'types';
import { AssertionsTab } from './AssertionsTab';
import { getMultiHttpFormStyles } from '../MultiHttpSettingsForm.styles';
import { getIsBodyDisabled } from './TabSection';

export interface MultiHttpTabProps {
  label?: string;
  index: number;
  activeTab?: MultiHttpFormTabs;
  active: boolean;
}

interface RequestTabsProps {
  index: number;
  activeTab: MultiHttpFormTabs;
}

export const HeadersTab = ({ label = 'header', index, active }: MultiHttpTabProps) => {
  const { control, register, unregister, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: `settings.multihttp.entries[${index}].request.headers`,
    control,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field label="Request headers" description="The HTTP headers set for the probe.">
        <>
          {fields.map((field, i) => {
            const headersNamePrefix = `settings.multihttp.entries[${index}].request.headers[${i}]`;

            return (
              <div className={cx({ [styles.tabInputContainer]: i === 0 })} key={field.id}>
                <HorizontalGroup spacing="md" align="flex-start" className={styles.headersQueryInputs}>
                  <HorizontalGroup spacing="md" align="flex-start" className={styles.headersQueryInputs}>
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
              </div>
            );
          })}
        </>
      </Field>
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
    </div>
  );
};

export const BodyTab = ({ index, active }: MultiHttpTabProps) => {
  const styles = useStyles2(getMultiHttpTabStyles);
  const { formState, register } = useFormContext();

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })} data-testid="body-tab">
      <Field label="Content type" description="Indicates the media type of the body">
        <Input
          {...register(`settings.multihttp.entries[${index}].request.body.contentType` as const)}
          id={`request-body-${index}-contentType`}
        />
      </Field>
      <Field label="Content encoding" description="Indicates the content encoding of the body">
        <Input
          {...register(`settings.multihttp.entries[${index}].request.body.contentEncoding` as const)}
          id={`request-body-${index}-contentEncoding`}
        />
      </Field>
      <Field
        label="Request body payload"
        description="The body of the HTTP request used in probe."
        invalid={Boolean(formState?.errors?.settings?.http?.body?.payload)}
        error={formState.errors?.settings?.http?.body?.payload?.message}
      >
        <TextArea
          {...register(`settings.multihttp.entries[${index}].request.body.payload` as const)}
          rows={2}
          id={`request-body-${index}-payload`}
        />
      </Field>
    </div>
  );
};

const QueryParamsTab = ({ index, label, active }: MultiHttpTabProps) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `settings.multihttp.entries[${index}].request.queryFields`,
  });
  const styles = useStyles2(getMultiHttpTabStyles);
  const { register, formState } = useFormContext();
  const errors = formState.errors?.settings?.multihttp?.entries?.[index]?.request?.queryFields;

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field label="Query params" description="Add values to the query string of the request URL">
        <>
          {fields.map((field, i) => {
            const queryParamsNamePrefix = `settings.multihttp.entries[${index}].request.queryFields[${i}]`;
            return (
              <div className={cx({ [styles.tabInputContainer]: i === 0 })} key={field.id}>
                <HorizontalGroup align="flex-start" spacing="md">
                  <HorizontalGroup spacing="md" align="flex-start">
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
              </div>
            );
          })}
        </>
      </Field>
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
    </div>
  );
};

const VariablesTab = ({ index, active }: MultiHttpTabProps) => {
  const variableFieldName = `settings.multihttp.entries[${index}].variables`;
  const { control, register, watch, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: variableFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field label="Variables" description="Select a value from the response and use it in a subsequent request">
        <>
          {fields.map((field, variableIndex) => {
            const variableTypeName = `${variableFieldName}[${variableIndex}].type` ?? '';
            const variableTypeValue = watch(variableTypeName)?.value;
            const errorPath = formState.errors.settings?.multihttp?.entries[index]?.variables?.[variableIndex];

            return (
              <div className={cx({ [styles.tabInputContainer]: variableIndex === 0 })} key={field.id}>
                <HorizontalGroup key={field.id} align="flex-start">
                  <Controller
                    name={variableTypeName}
                    render={({ field: typeField }) => {
                      return (
                        <Field
                          label="Variable type"
                          description="The method of getting a value"
                          invalid={errorPath?.type}
                        >
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
                  <Field
                    label="Variable name"
                    description="The name of the variable"
                    invalid={errorPath?.name}
                    error={errorPath?.name?.message}
                  >
                    <Input
                      placeholder="Variable name"
                      id={`multihttp-variable-name-${index}-${variableIndex}`}
                      invalid={formState.errors.settings?.multihttp?.entries[index]?.variables?.[variableIndex]?.type}
                      {...register(`${variableFieldName}[${variableIndex}].name`, {
                        required: 'Variable name is required',
                      })}
                    />
                  </Field>
                  {variableTypeValue === MultiHttpVariableType.CSS_SELECTOR && (
                    <Field
                      label="Attribute"
                      description="Attribute of the first found element to use"
                      invalid={errorPath?.attribute}
                      error={errorPath?.attribute?.message}
                    >
                      <Input
                        placeholder="Attribute"
                        id={`multihttp-variable-attribute-${index}-${variableIndex}`}
                        {...register(`${variableFieldName}[${variableIndex}].attribute`)}
                      />
                    </Field>
                  )}
                  <Field
                    label="Variable expression"
                    description="Expression to extract the value"
                    invalid={errorPath?.expression}
                    error={errorPath?.expression?.message}
                  >
                    <Input
                      placeholder="Variable expression"
                      id={`multihttp-variable-expression-${index}-${variableIndex}`}
                      {...register(`${variableFieldName}[${variableIndex}].expression`, {
                        required: 'Expression is required',
                      })}
                    />
                  </Field>
                  <IconButton
                    name="trash-alt"
                    onClick={() => remove(variableIndex)}
                    className={styles.removeIconWithLabel}
                  />
                </HorizontalGroup>
              </div>
            );
          })}
        </>
      </Field>
      <Button
        onClick={() => {
          append({ type: undefined, name: '', expression: '' });
        }}
        variant="secondary"
        size="sm"
        type="button"
        // className={styles.addHeaderQueryButton}
      >
        <Icon name="plus" />
        &nbsp; Add variable
      </Button>
    </div>
  );
};

export const RequestTabs = ({ activeTab, index }: RequestTabsProps) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const { watch } = useFormContext();
  const method = watch(`settings.multihttp.entries[${index}].request.method`);
  const hideBody = getIsBodyDisabled(method);
  return (
    <TabContent className={styles.tabsContent}>
      <HeadersTab label="header" index={index} active={activeTab === 'header'} />
      {!hideBody && <BodyTab index={index} active={activeTab === 'body'} />}
      <QueryParamsTab index={index} label="queryParams" active={activeTab === 'queryParams'} />
      <VariablesTab index={index} label="variables" active={activeTab === 'variables'} />
      <AssertionsTab index={index} label="assertions" active={activeTab === 'assertions'} />
    </TabContent>
  );
};

export const getMultiHttpTabStyles = (theme: GrafanaTheme2) => ({
  removeIcon: css`
    margin-top: 6px;
  `,
  removeIconWithLabel: css`
    margin-top: 26px;
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
  inactive: css`
    display: none;
  `,
  tabInputContainer: css`
    margin-top: ${theme.spacing(2)};
  `,
});
