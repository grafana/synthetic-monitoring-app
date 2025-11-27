import React, { useEffect, useState } from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Dropdown, Icon, Input, Menu, Stack, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormValues, HttpMethod } from 'types';
import { getMethodColor } from 'utils';

import { ALLOWED_HTTP_REQUEST_METHODS, DEFAULT_EXAMPLE_HOSTNAME } from '../../constants';
import { getFieldErrorProps } from '../../utils/form';
import { QueryParamsEditor } from '../QueryParamsEditor';
import { Indent } from '../ui/Indent';
import { SecondaryContainer } from '../ui/SecondaryContainer';
import { StyledField } from '../ui/StyledField';

interface FormHttpRequestMethodTargetFieldsProps {
  'data-testid'?: string;
  'method-data-testid'?: string;
  field: 'target' | `settings.multihttp.entries.${number}.request.url`;
  methodField?: FieldPath<CheckFormValues>;
  withQueryParams?: true;
  placeholder?: string;
}

export function FormHttpRequestMethodTargetFields({
  'data-testid': dataTestId,
  'method-data-testid': methodDataTestId,
  field = 'target',
  methodField,
  withQueryParams,
  placeholder = `https://${DEFAULT_EXAMPLE_HOSTNAME}/`,
}: FormHttpRequestMethodTargetFieldsProps) {
  const styles = useStyles2(getStyles);

  const {
    watch,
    setValue,
    formState: { errors, disabled },
    register,
  } = useFormContext<CheckFormValues>();

  const [showQueryParams, setShowQueryParams] = useState<boolean>(false);

  const targetValue = watch(field) as string;

  const handleQueryParamsOnChange = (newUrl: string) => {
    setValue(field, newUrl, { shouldDirty: true });
  };

  return (
    <Stack direction="column" gap={1}>
      <StyledField
        label="Request target"
        description="Full URL to send requests to"
        {...getFieldErrorProps(errors, field)}
        required
      >
        <Input
          data-testid={dataTestId}
          id={field}
          placeholder={placeholder}
          prefix={!!methodField && <Methods data-testid={methodDataTestId} field={methodField} />}
          {...register(field)}
          type="text"
          disabled={disabled}
          suffix={
            withQueryParams && (
              <Button
                tooltip="Manage query parameters"
                aria-label={`Manage query parameters`}
                aria-pressed={showQueryParams}
                type="button"
                onClick={() => setShowQueryParams(!showQueryParams)}
                className={cx(styles.queryParamsButton, showQueryParams && styles.queryParamsButtonActive)}
                variant="secondary"
                fill="text"
              >
                ?=
              </Button>
            )
          }
        />
      </StyledField>
      {showQueryParams && (
        <Indent>
          <SecondaryContainer>
            <Stack gap={1} direction="column">
              <StyledField label="Query Parameters" description="Manage query parameters.">
                <QueryParamsEditor
                  url={targetValue}
                  onDismissWarning={() => {
                    setShowQueryParams(false);
                  }}
                  onChange={handleQueryParamsOnChange}
                />
              </StyledField>
              <Text variant="bodySmall" color="secondary">
                Looking for <Text color="primary">&#34;Cache busting query parameter&#34;</Text>? It can be found under{' '}
                <Text color="primary">&#34;Request options&#34;</Text>.
              </Text>
            </Stack>
          </SecondaryContainer>
        </Indent>
      )}
    </Stack>
  );
}

interface MethodsProps {
  ['data-testid']?: string;
  field: FieldPath<CheckFormValues>;
}

function Methods({ 'data-testid': dataTestId, field }: MethodsProps) {
  const {
    register,
    setValue,
    watch,
    getValues,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const formValue = watch(field) as HttpMethod;
  const [value, _setValue] = useState<HttpMethod>(formValue as HttpMethod);

  useEffect(() => {
    if (!disabled && field && value && getValues(field) !== value) {
      setValue(field, value, { shouldDirty: true });
    }
  }, [disabled, field, getValues, setValue, value]);

  const styles = useStyles2(getMethodsStyles, formValue);

  return (
    <>
      <Dropdown overlay={<RequestMethodMenu onChange={_setValue} />}>
        <div
          data-testid={dataTestId}
          tabIndex={0}
          role="button"
          aria-label={`Request method *`}
          className={styles.container}
        >
          <span className={styles.methodValue}>{formValue}</span>
          <Icon name="angle-down" />
        </div>
      </Dropdown>
      <input disabled={disabled} type="hidden" {...register(field)} />
    </>
  );
}

function RequestMethodMenu({ onChange }: { onChange: (value: HttpMethod) => void }) {
  const theme = useTheme2();

  return (
    <Menu ariaLabel="Select request method">
      {ALLOWED_HTTP_REQUEST_METHODS.map((method) => (
        <Menu.Item
          className={css`
            color: ${getMethodColor(theme, method)};
          `}
          key={method}
          label={method}
          onClick={() => onChange(method)}
        />
      ))}
    </Menu>
  );
}

function getMethodsStyles(theme: GrafanaTheme2, method: HttpMethod) {
  return {
    container: css`
      display: inline-flex;
      border-right: 1px solid ${theme.colors.border.medium};
      padding-right: ${theme.spacing(1)};
      margin-right: ${theme.spacing(1)};
      cursor: pointer;
      min-width: 100px;
      align-items: center;
      justify-content: space-between;
    `,
    methodValue: css`
      font-weight: 600;
      color: ${getMethodColor(theme, method)};
    `,
  };
}

function getStyles(theme: GrafanaTheme2) {
  return {
    queryParamsButton: css`
      background-color: transparent;
      border: none;
      padding: 0;

      &:hover {
        background-color: transparent;
      }
    `,
    queryParamsButtonActive: css`
      color: ${theme.colors.primary.border};
    `,
  };
}
