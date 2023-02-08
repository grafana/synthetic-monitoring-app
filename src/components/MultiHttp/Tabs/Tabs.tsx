import React, { Fragment } from 'react';
import { css } from '@emotion/css';
import { useFieldArray, useFormContext } from 'react-hook-form';

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
import { validateHTTPBody } from 'validation';

interface Props {
  label?: string;
  index: number;
  activeTab?: 'header' | 'queryParams' | 'body';
}

interface RequestTabsProps {
  index: number;
  activeTab: 'header' | 'queryParams' | 'body';
}

export const HeadersTab = ({ label = 'header', index }: Props) => {
  const { control, register, unregister, formState } = useFormContext();
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
                  <Fragment key={field.id}>
                    <HorizontalGroup spacing="md" align="center" className={styles.headersQueryInputs}>
                      <HorizontalGroup spacing="md" align="center" className={styles.headersQueryInputs}>
                        <Input
                          {...register(`${headersNamePrefix}.name` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          placeholder="name"
                          data-testid={`header-name-${index}`}
                        />
                        <Input
                          {...register(`${headersNamePrefix}.value` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          data-testid={`header-value-${index}`}
                          placeholder="value"
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
                    {(formState.errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.name ||
                      formState.errors?.settings?.multihttp?.entries[index]?.request?.headers[i]?.value) && (
                      <>
                        <div className={styles.errorMsg}>Enter at least one character</div>
                        <br />
                      </>
                    )}
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

export const BodyTab = ({ index }: Props) => {
  const styles = useStyles2(getStyles);
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
          {...register(`settings.multihttp.entries[${index}].request.body`, { validate: validateHTTPBody })}
          rows={2}
          id={`request-body-${index}`}
        />
      </Field>
    </div>
  );
};

const QueryParamsTab = ({ index, label }: Props) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `settings.multihttp.entries[${index}].request.queryString`,
  });
  const styles = useStyles2(getStyles);
  const { register, formState } = useFormContext();

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
                        <Input
                          {...register(`${queryParamsNamePrefix}.name` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          placeholder="Parameter name"
                          data-testid="query-param-name"
                        />
                        <Input
                          {...register(`${queryParamsNamePrefix}.value` as const, {
                            required: true,
                            minLength: 1,
                          })}
                          type="text"
                          placeholder="Parameter value"
                          data-testid="query-param-value"
                        />
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
                    {(formState.errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.name ||
                      formState.errors?.settings?.multihttp?.entries[index]?.request?.queryString[i]?.value) && (
                      <>
                        <div className={styles.errorMsg}>Enter at least one character</div>
                        <br />
                      </>
                    )}
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

export const RequestTabs = ({ activeTab, index }: RequestTabsProps) => {
  switch (activeTab) {
    case 'header':
      return <HeadersTab label="header" index={index} />;
    case 'body':
      return <BodyTab index={index} />;
    case 'queryParams':
      return <QueryParamsTab index={index} label="queryParams" />;
    default:
      return <HeadersTab label="header" index={index} />;
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
