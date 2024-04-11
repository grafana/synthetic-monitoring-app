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
import { css, cx } from '@emotion/css';

import { CheckFormValuesMultiHttp, MultiHttpVariableType } from 'types';
import { RequestHeaders } from 'components/CheckEditor/FormComponents/RequestHeaders';
import { MULTI_HTTP_VARIABLE_TYPE_OPTIONS } from 'components/constants';
import { MultiHttpFormTabs } from 'components/MultiHttp/MultiHttpTypes';

import { getMultiHttpFormStyles } from '../MultiHttpSettingsForm.styles';
import { AssertionsTab } from './AssertionsTab';
import { getIsBodyDisabled } from './TabSection';

export interface MultiHttpTabProps {
  index: number;
  activeTab?: MultiHttpFormTabs;
  active: boolean;
}

interface RequestTabsProps {
  index: number;
  activeTab: MultiHttpFormTabs;
}

export const HeadersTab = ({ index, active }: MultiHttpTabProps) => {
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <RequestHeaders
        ariaLabelSuffix={`for request ${index + 1}`}
        description="The HTTP headers set for the probe."
        label="Request header"
        name={`settings.multihttp.entries.${index}.request.headers`}
      />
    </div>
  );
};

export const BodyTab = ({ index, active }: MultiHttpTabProps) => {
  const styles = useStyles2(getMultiHttpTabStyles);
  const { formState, register } = useFormContext<CheckFormValuesMultiHttp>();

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })} data-testid="body-tab">
      <Field label="Content type" description="Indicates the media type of the body">
        <Input
          {...register(`settings.multihttp.entries.${index}.request.body.contentType`)}
          id={`request-body-${index}-contentType`}
          data-fs-element="Request body content type input"
        />
      </Field>
      <Field label="Content encoding" description="Indicates the content encoding of the body">
        <Input
          {...register(`settings.multihttp.entries.${index}.request.body.contentEncoding`)}
          id={`request-body-${index}-contentEncoding`}
          data-fs-element="Request body content encoding input"
        />
      </Field>
      <Field
        label="Request body payload"
        description="The body of the HTTP request used in probe."
        invalid={Boolean(formState?.errors?.settings?.multihttp?.entries?.[index]?.request?.body?.payload)}
        error={formState?.errors?.settings?.multihttp?.entries?.[index]?.request?.body?.payload?.message}
      >
        <TextArea
          {...register(`settings.multihttp.entries.${index}.request.body.payload`)}
          rows={2}
          id={`request-body-${index}-payload`}
          data-fs-element="Request body payload textarea"
        />
      </Field>
    </div>
  );
};

const QueryParamsTab = ({ index, active }: MultiHttpTabProps) => {
  const { control, register, formState } = useFormContext<CheckFormValuesMultiHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: `settings.multihttp.entries.${index}.request.queryFields`,
  });
  const styles = useStyles2(getMultiHttpTabStyles);
  const errors = formState.errors?.settings?.multihttp?.entries?.[index]?.request?.queryFields;

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field label="Query params" description="Add values to the query string of the request URL">
        <>
          {fields.map((field, i) => {
            return (
              <div key={field.id}>
                <HorizontalGroup align="flex-start" spacing="md">
                  <HorizontalGroup spacing="md" align="flex-start">
                    <Field invalid={Boolean(errors?.[i]?.name)} error={errors?.[i]?.name?.message}>
                      <Input
                        {...register(`settings.multihttp.entries.${index}.request.queryFields.${i}.name`, {
                          required: 'Query param name required',
                          minLength: 1,
                        })}
                        type="text"
                        placeholder="Parameter name"
                        data-testid="query-param-name"
                        data-fs-element="Query param name input"
                      />
                    </Field>
                    <Field invalid={Boolean(errors?.[i]?.value)} error={errors?.[i]?.value?.message}>
                      <Input
                        {...register(`settings.multihttp.entries.${index}.request.queryFields.${i}.value`, {
                          required: 'Query param value required',
                          minLength: 1,
                        })}
                        type="text"
                        placeholder="Parameter value"
                        data-testid="query-param-value"
                        data-fs-element="Query param value input"
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
                    tooltip="Delete"
                    data-fs-element="Delete query param button"
                  />
                </HorizontalGroup>
              </div>
            );
          })}
        </>
      </Field>
      <Button
        onClick={() => append({ name: ``, value: `` })}
        variant="secondary"
        size="sm"
        type="button"
        className={styles.addHeaderQueryButton}
        data-fs-element="Add query param button"
      >
        <Icon name="plus" />
        &nbsp; Add query param
      </Button>
    </div>
  );
};

const VariablesTab = ({ index, active }: MultiHttpTabProps) => {
  const variableFieldName = `settings.multihttp.entries.${index}.variables` as const;
  const { control, register, watch, formState } = useFormContext<CheckFormValuesMultiHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesMultiHttp>({
    control,
    name: variableFieldName,
  });
  const styles = useStyles2(getMultiHttpTabStyles);

  return (
    <div className={cx(styles.inputsContainer, { [styles.inactive]: !active })}>
      <Field label="Variables" description="Select a value from the response and use it in a subsequent request">
        <>
          {fields.map((field, variableIndex) => {
            const variableTypeName = `${variableFieldName}.${variableIndex}.type` as const;
            const variableTypeValue = watch(variableTypeName)?.value;
            const errorPath = formState.errors.settings?.multihttp?.entries?.[index]?.variables?.[variableIndex];
            // @ts-expect-error -- I think type is a reserved keyword in react-hook-form so it can't read this properly
            const errMessage = errorPath?.type?.message;

            return (
              <div className={styles.fieldsContainer} key={field.id}>
                <Controller<CheckFormValuesMultiHttp>
                  name={variableTypeName}
                  render={({ field: typeField }) => {
                    const { ref, ...rest } = typeField;
                    return (
                      <Field
                        label="Variable type"
                        description="The method of getting a value"
                        invalid={Boolean(errorPath?.type)}
                        error={typeof errMessage === `string` && errMessage}
                        data-fs-element="Variable type select"
                      >
                        <Select
                          id={`multihttp-variable-type-${index}-${variableIndex}`}
                          className={styles.minInputWidth}
                          {...rest}
                          options={MULTI_HTTP_VARIABLE_TYPE_OPTIONS}
                          menuPlacement="bottom"
                        />
                      </Field>
                    );
                  }}
                  rules={{ required: `Variable type is required` }}
                />
                <Field
                  label="Variable name"
                  description="The name of the variable"
                  invalid={Boolean(errorPath?.name)}
                  error={errorPath?.name?.message}
                >
                  <Input
                    placeholder="Variable name"
                    id={`multihttp-variable-name-${index}-${variableIndex}`}
                    invalid={Boolean(
                      formState.errors.settings?.multihttp?.entries?.[index]?.variables?.[variableIndex]?.type
                    )}
                    data-fs-element="Variable name input"
                    {...register(`${variableFieldName}.${variableIndex}.name`, {
                      required: 'Variable name is required',
                    })}
                  />
                </Field>
                {variableTypeValue === MultiHttpVariableType.CSS_SELECTOR && (
                  <Field
                    label="Attribute"
                    description="Name of the attribute to extract the value from. Leave blank to get contents of tag"
                    invalid={Boolean(errorPath?.attribute)}
                    error={errorPath?.attribute?.message}
                  >
                    <Input
                      placeholder="Attribute"
                      id={`multihttp-variable-attribute-${index}-${variableIndex}`}
                      data-fs-element="Variable attribute input"
                      {...register(`${variableFieldName}.${variableIndex}.attribute`)}
                    />
                  </Field>
                )}
                <Field
                  label="Variable expression"
                  description="Expression to extract the value"
                  invalid={Boolean(errorPath?.expression)}
                  error={errorPath?.expression?.message}
                >
                  <Input
                    placeholder="Variable expression"
                    id={`multihttp-variable-expression-${index}-${variableIndex}`}
                    data-fs-element="Variable expression input"
                    {...register(`${variableFieldName}.${variableIndex}.expression`, {
                      required: 'Expression is required',
                    })}
                  />
                </Field>
                <div className={styles.iconContainer}>
                  <IconButton
                    name="minus-circle"
                    onClick={() => remove(variableIndex)}
                    tooltip="Delete"
                    data-fs-element="Variable delete button"
                  />
                </div>
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
        data-fs-element="Variable delete button"
      >
        <Icon name="plus" />
        &nbsp; Add variable
      </Button>
    </div>
  );
};

export const RequestTabs = ({ activeTab, index }: RequestTabsProps) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const { watch } = useFormContext<CheckFormValuesMultiHttp>();
  const method = watch(`settings.multihttp.entries.${index}.request.method`);
  const hideBody = getIsBodyDisabled(method);

  return (
    <TabContent className={styles.tabsContent}>
      <HeadersTab index={index} active={activeTab === MultiHttpFormTabs.Headers} />
      {!hideBody && <BodyTab index={index} active={activeTab === MultiHttpFormTabs.Body} />}
      <QueryParamsTab index={index} active={activeTab === MultiHttpFormTabs.QueryParams} />
      <VariablesTab index={index} active={activeTab === MultiHttpFormTabs.Variables} />
      <AssertionsTab index={index} active={activeTab === MultiHttpFormTabs.Assertions} />
    </TabContent>
  );
};

export const getMultiHttpTabStyles = (theme: GrafanaTheme2) => ({
  removeIcon: css`
    margin-top: 6px;
  `,
  fieldsContainer: css({
    alignItems: 'baseline',
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  }),
  iconContainer: css`
    margin-left: ${theme.spacing(2)};
    position: relative;
    top: ${theme.spacing(4)};
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
});
