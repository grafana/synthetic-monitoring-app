import React, { useState, Fragment } from 'react';
import {
  Container,
  HorizontalGroup,
  Field,
  Select,
  Switch,
  MultiSelect,
  TextArea,
  Input,
  VerticalGroup,
  useStyles,
  Label,
  Checkbox,
  IconButton,
  Button,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { HttpVersion, CheckType, HttpRegexValidationType } from 'types';
import { Collapse } from 'components/Collapse';
import {
  HTTP_COMPRESSION_ALGO_OPTIONS,
  HTTP_REGEX_VALIDATION_OPTIONS,
  HTTP_SSL_OPTIONS,
  IP_OPTIONS,
  methodOptions,
} from 'components/constants';

import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';
import { NameValueInput } from 'components/NameValueInput';
import { validateBearerToken, validateHTTPBody, validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';
import { GrafanaTheme } from '@grafana/data';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

const httpVersionOptions = [
  {
    label: 'HTTP/1.0',
    value: HttpVersion.HTTP1_0,
  },
  {
    label: 'HTTP/1.1',
    value: HttpVersion.HTTP1_1,
  },
  {
    label: 'HTTP/2',
    value: HttpVersion.HTTP2_0,
  },
];

const generateValidStatusCodes = () => {
  let validCodes = [];
  for (let i = 100; i <= 102; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 200; i <= 208; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 300; i <= 308; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  for (let i = 400; i <= 418; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '422',
    value: 422,
  });
  validCodes.push({
    label: '426',
    value: 426,
  });
  validCodes.push({
    label: '428',
    value: 428,
  });
  validCodes.push({
    label: '429',
    value: 429,
  });
  validCodes.push({
    label: '431',
    value: 431,
  });
  for (let i = 500; i <= 511; i++) {
    validCodes.push({
      label: `${i}`,
      value: i,
    });
  }
  validCodes.push({
    label: '598',
    value: 598,
  });
  validCodes.push({
    label: '599',
    value: 599,
  });
  return validCodes;
};

const validStatusCodes = generateValidStatusCodes();
const REGEX_FIELD_NAME = 'settings.http.regexValidations';

const getStyles = (theme: GrafanaTheme) => ({
  validationGroup: css`
    max-width: 400px;
  `,
  validationGrid: css`
    display: grid;
    grid-template-columns: 300px auto 70px auto auto;
    grid-gap: ${theme.spacing.sm};
    align-items: center;
    width: 100%;
  `,
  validationInverted: css`
    position: relative;
    justify-self: center;
  `,
  maxWidth: css`
    max-width: 500px;
  `,
  validationExpressions: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  validationHeaderName: css`
    margin-right: ${theme.spacing.sm};
  `,
  validationAllowMissing: css`
    justify-self: start;
  `,
});

interface Props {
  isEditor: boolean;
}

export const HttpSettingsForm = ({ isEditor }: Props) => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const [showHttpSettings, setShowHttpSettings] = useState(false);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bearerToken = watch('settings.http.bearerToken');
  const basicAuth = watch('settings.http.basicAuth');

  const [includeBearerToken, setIncludeBearerToken] = useState(Boolean(bearerToken));
  const [includeBasicAuth, setIncludeBasicAuth] = useState(Boolean(basicAuth));
  const { fields, append, remove } = useFieldArray({ control, name: REGEX_FIELD_NAME });
  const styles = useStyles(getStyles);

  return (
    <Container>
      <Collapse
        label="HTTP settings"
        onToggle={() => setShowHttpSettings(!showHttpSettings)}
        isOpen={showHttpSettings}
        collapsible
      >
        <HorizontalGroup>
          <Field
            label="Request method"
            description="The HTTP method the probe will use"
            disabled={!isEditor}
            invalid={Boolean(errors?.settings?.http?.method)}
            error={errors?.settings?.http?.method}
          >
            <Controller
              render={({ field }) => <Select {...field} options={methodOptions} />}
              rules={{ required: true }}
              name="settings.http.method"
            />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field
            label="Request body"
            description="The body of the HTTP request used in probe."
            disabled={!isEditor}
            invalid={Boolean(errors?.settings?.http?.body)}
            error={errors?.settings?.http?.body}
          >
            <TextArea
              id="http-settings-request-body"
              {...register('settings.http.body', { validate: validateHTTPBody })}
              rows={2}
              disabled={!isEditor}
            />
          </Field>
        </Container>
        <Container>
          <Field label="Request headers" description="The HTTP headers set for the probe.." disabled={!isEditor}>
            <NameValueInput
              name="settings.http.headers"
              disabled={!isEditor}
              label="header"
              limit={10}
              validateName={validateHTTPHeaderName}
              validateValue={validateHTTPHeaderValue}
            />
          </Field>
        </Container>
        <HorizontalGroup>
          <Field
            label="Compression option"
            description="The compression algorithm to expect in the response body"
            disabled={!isEditor}
          >
            <Controller
              name="settings.http.compression"
              render={({ field }) => (
                <Select {...field} data-testid="http-compression" options={HTTP_COMPRESSION_ALGO_OPTIONS} />
              )}
            />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field label="Proxy URL" description="HTTP proxy server to use to connect to the target" disabled={!isEditor}>
            <Input id="proxyUrl" {...register('settings.http.proxyURL')} type="text" />
          </Field>
          <Field label="Proxy connect headers" description="The HTTP headers sent to the proxy." disabled={!isEditor}>
            <NameValueInput
              name="settings.http.proxyConnectHeaders"
              disabled={!isEditor}
              label="proxy connect header"
              limit={10}
              validateName={validateHTTPHeaderName}
              validateValue={validateHTTPHeaderValue}
            />
          </Field>
        </Container>
      </Collapse>
      <TLSConfig isEditor={isEditor} checkType={CheckType.HTTP} />
      <Collapse
        label="Authentication"
        onToggle={() => setShowAuthentication(!showAuthentication)}
        isOpen={showAuthentication}
        collapsible
      >
        <VerticalGroup spacing="xs">
          <HorizontalCheckboxField
            label="Include bearer authorization header in request"
            id="http-settings-bearer-authorization"
            disabled={!isEditor}
            className={
              !includeBearerToken
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
            value={includeBearerToken}
            onChange={() => setIncludeBearerToken(!includeBearerToken)}
          />
          {includeBearerToken && (
            <Field invalid={Boolean(errors.settings?.http?.bearerToken)} error={errors.settings?.http?.bearerToken}>
              <Input
                {...register('settings.http.bearerToken', {
                  validate: validateBearerToken,
                })}
                type="password"
                placeholder="Bearer token"
                disabled={!isEditor}
              />
            </Field>
          )}
        </VerticalGroup>
        <VerticalGroup spacing="xs">
          <HorizontalCheckboxField
            label="Include basic authorization header in request"
            id="http-settings-basic-authorization"
            disabled={!isEditor}
            className={
              !includeBasicAuth
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
            value={includeBasicAuth}
            onChange={() => setIncludeBasicAuth(!includeBasicAuth)}
          />
          {includeBasicAuth && (
            <HorizontalGroup>
              <Input
                {...register('settings.http.basicAuth.username')}
                type="text"
                placeholder="Username"
                disabled={!isEditor}
              />
              <Input
                {...register('settings.http.basicAuth.password')}
                type="password"
                placeholder="Password"
                disabled={!isEditor}
              />
            </HorizontalGroup>
          )}
        </VerticalGroup>
      </Collapse>
      <Collapse
        label="Validation"
        onToggle={() => setShowValidation(!showValidation)}
        isOpen={showValidation}
        collapsible
      >
        <div className={styles.validationGroup}>
          <Field
            label="Valid status codes"
            description="Accepted status codes for this probe. Defaults to 2xx."
            disabled={!isEditor}
          >
            <Controller
              control={control}
              name="settings.http.validStatusCodes"
              render={({ field }) => <MultiSelect {...field} options={validStatusCodes} disabled={!isEditor} />}
            />
          </Field>
          <Field label="Valid HTTP versions" description="Accepted HTTP versions for this probe" disabled={!isEditor}>
            <Controller
              control={control}
              name="settings.http.validHTTPVersions"
              render={({ field }) => <MultiSelect {...field} options={httpVersionOptions} disabled={!isEditor} />}
            />
          </Field>
          <Field
            label="SSL options"
            description="Choose whether probe fails if SSL is present or not present"
            disabled={!isEditor}
          >
            <Controller
              name="settings.http.sslOptions"
              control={control}
              render={({ field }) => <Select {...field} options={HTTP_SSL_OPTIONS} disabled={!isEditor} />}
            />
          </Field>
        </div>
        <VerticalGroup width="100%">
          <Label>Regex Validation</Label>
          {Boolean(fields.length) && (
            <div className={styles.validationGrid}>
              <Label>Field Name</Label>
              <Label>Match condition</Label>
              <Label>Invert Match</Label>
              <Label>Allow Missing</Label>
              <div />
              {fields.map((field, index) => {
                const isHeaderMatch =
                  watch(`${REGEX_FIELD_NAME}.${index}.matchType`)?.value === HttpRegexValidationType.Header;
                const disallowBodyMatching = watch('settings.http.method').value === HttpMethod.HEAD;
                return (
                  <Fragment key={field.id}>
                    <Controller
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Field name"
                          options={HTTP_REGEX_VALIDATION_OPTIONS}
                          invalid={
                            disallowBodyMatching &&
                            errors?.settings?.http?.regexValidations?.[index]?.matchType?.message
                          }
                        />
                      )}
                      rules={{
                        validate: (value) => {
                          if (disallowBodyMatching) {
                            if (value?.value === HttpRegexValidationType.Body) {
                              return 'Cannot validate the body of a HEAD request';
                            }
                            return;
                          }
                          return;
                        },
                      }}
                      name={`${REGEX_FIELD_NAME}.${index}.matchType` as const}
                    />
                    <div className={styles.validationExpressions}>
                      {isHeaderMatch && (
                        <div className={styles.validationHeaderName}>
                          <Input
                            {...register(`${REGEX_FIELD_NAME}.${index}.header` as const)}
                            placeholder="Header name"
                          />
                        </div>
                      )}
                      <Input {...register(`${REGEX_FIELD_NAME}.${index}.expression` as const)} placeholder="Regex" />
                    </div>
                    <div className={styles.validationInverted}>
                      <Checkbox {...register(`${REGEX_FIELD_NAME}.${index}.inverted` as const)} />
                    </div>
                    {isHeaderMatch ? (
                      <div className={styles.validationAllowMissing}>
                        <Switch {...register(`${REGEX_FIELD_NAME}.${index}.allowMissing` as const)} />
                      </div>
                    ) : (
                      <div />
                    )}
                    <IconButton name="minus-circle" onClick={() => remove(index)} />
                  </Fragment>
                );
              })}
            </div>
          )}
          <Button
            type="button"
            icon="plus"
            variant="secondary"
            size="sm"
            disabled={!isEditor}
            onClick={() => append({ matchType: HTTP_REGEX_VALIDATION_OPTIONS[1], expression: '', inverted: false })}
          >
            Add Regex Validation
          </Button>
        </VerticalGroup>
      </Collapse>
      <Collapse
        label="Advanced options"
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
        collapsible
      >
        <div className={styles.maxWidth}>
          <LabelField isEditor={isEditor} />
          <Field label="IP version" description="The IP protocol of the HTTP request" disabled={!isEditor}>
            <Controller
              render={({ field }) => <Select {...field} options={IP_OPTIONS} />}
              name="settings.http.ipVersion"
            />
          </Field>
          <HorizontalCheckboxField
            id="http-settings-followRedirects"
            label="Follow redirects"
            disabled={!isEditor}
            name="settings.http.followRedirects"
          />
          <Field
            label="Cache busting query parameter name"
            description="The name of the query parameter used to prevent the server from using a cached response. Each probe will assign a random value to this parameter each time a request is made."
          >
            <Input
              id="https-settings-cache-busting-query"
              {...register('settings.http.cacheBustingQueryParamName')}
              type="string"
              placeholder="cache-bust"
              disabled={!isEditor}
            />
          </Field>
        </div>
      </Collapse>
    </Container>
  );
};
