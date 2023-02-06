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
  TextArea,
  VerticalGroup,
  useStyles2,
} from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { validateHTTPBody, validateHTTPHeaderValue } from 'validation';
import { CheckFormValues } from 'types';

interface Props {
  register: UseFormRegister<CheckFormValues | FieldValues>;
  label?: string;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
  activeTab?: 'header' | 'queryParams' | 'body';
}

interface RequestTabsProps {
  register: UseFormRegister<CheckFormValues | FieldValues>;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
  activeTab: 'header' | 'queryParams' | 'body';
}

export const HeadersTab = ({ register, unregister, trigger, label = 'header', errors, index }: Props) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: `settings.multihttp.entries[${index}].request.headers`,
    control,
  });
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Request headers" description="The HTTP headers set for the probe.">
            <>
              {fields.map((field, i) => {
                const headersNamePrefix = `settings.multihttp.entries[${index}].request.headers[${i}]`;

                return (
                  <>
                    <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                      <HorizontalGroup key={field.id} spacing="md" align="center" className={styles.headersQueryInputs}>
                        <Input
                          {...register(`${headersNamePrefix}.name` as const, {
                            required: true,
                          })}
                          type="text"
                          placeholder="name"
                          onMouseLeave={() =>
                            trigger(`${headersNamePrefix}.name`, {
                              shouldFocus: true,
                              shouldUnregister: true,
                            })
                          }
                        />
                        <Input
                          {...register(`${headersNamePrefix}.value` as const, {
                            required: true,
                            minLength: 1,
                            validate: validateHTTPHeaderValue,
                          })}
                          type="text"
                          placeholder="value"
                          onMouseLeave={() =>
                            trigger(`${headersNamePrefix}.value`, {
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
                          unregister([`${headersNamePrefix}`]);
                        }}
                      />
                    </HorizontalGroup>
                    {(errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.name ||
                      errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.value) && (
                      <>
                        <div className={styles.errorMsg}>Enter at least one character</div>
                        <br />
                      </>
                    )}
                  </>
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

export const BodyTab = ({ index, errors, register }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <Field
        label="Request body"
        description="The body of the HTTP request used in probe."
        invalid={Boolean(errors?.settings?.http?.body)}
        error={errors?.settings?.http?.body}
      >
        <TextArea
          {...register(`settings.multihttp.entries[${index}].request.body`, { validate: validateHTTPBody })}
          rows={2}
        />
      </Field>
    </div>
  );
};

const QueryParamsTab = ({ register, unregister, index, errors, trigger, label }: Props) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `settings.multihttp.entries[${index}].request.queryString`,
  });
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.inputsContainer}>
      <VerticalGroup justify="space-between" className={styles.inputsContainer}>
        <Container>
          <Field label="Query params">
            <>
              {fields.map((field, i) => {
                const queryParamsNamePrefix = `settings.multihttp.entries[${index}].request.queryString[${i}]`;

                return (
                  <>
                    <HorizontalGroup key={field.id} align="flex-start" spacing="md">
                      <HorizontalGroup key={field.id} spacing="md" align="center">
                        <Input
                          {...register(`${queryParamsNamePrefix}.name` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          placeholder="Parameter name"
                          onMouseLeave={() =>
                            trigger(`${queryParamsNamePrefix}.name` as const, {
                              shouldFocus: true,
                              shouldUnregister: true,
                            })
                          }
                        />
                        <Input
                          {...register(`${queryParamsNamePrefix}.value` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          placeholder="Parameter value"
                          onMouseLeave={() =>
                            trigger(`${queryParamsNamePrefix}.value` as const, {
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
                          unregister([`${queryParamsNamePrefix}`]);
                        }}
                      />
                    </HorizontalGroup>
                    {(errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.name ||
                      errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.value) && (
                      <>
                        <div className={styles.errorMsg}>Enter at least one character</div>
                        <br />
                      </>
                    )}
                  </>
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

export const RequestTabs = ({ activeTab, errors, register, unregister, index, trigger }: RequestTabsProps) => {
  switch (activeTab) {
    case 'header':
      return (
        <HeadersTab
          unregister={unregister}
          trigger={trigger}
          register={register}
          label="header"
          index={index}
          errors={errors}
        />
      );
    case 'body':
      return <BodyTab index={index} errors={errors} register={register} />;
    case 'queryParams':
      return (
        <QueryParamsTab
          register={register}
          index={index}
          unregister={unregister}
          errors={errors}
          trigger={trigger}
          label="queryParams"
        />
      );
    default:
      return (
        <HeadersTab
          unregister={unregister}
          trigger={trigger}
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
  errorMsg: css`
    color: ${theme.colors.error.text};
  `,
});
