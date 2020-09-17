import React, { FC, useState } from 'react';
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
} from '@grafana/ui';
import { css } from 'emotion';
import { useFormContext, Controller } from 'react-hook-form';
import { HttpMethod, HttpVersion, CheckType } from 'types';
import { Collapse } from 'components/Collapse';
import { BodyRegexMatcherInput } from 'components/BodyRegexMatcherInput';
import { HeaderRegexMatcherInput } from 'components/HeaderRegexMatcherInput';
import { HTTP_SSL_OPTIONS, IP_OPTIONS } from '../constants';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';
import { NameValueInput } from 'components/NameValueInput';
import { validateBearerToken, validateHTTPBody, validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';

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

const methodOptions = [
  {
    label: 'GET',
    value: HttpMethod.GET,
  },
  {
    label: 'HEAD',
    value: HttpMethod.HEAD,
  },
  {
    label: 'PUT',
    value: HttpMethod.PUT,
  },
  {
    label: 'POST',
    value: HttpMethod.POST,
  },
  {
    label: 'DELETE',
    value: HttpMethod.DELETE,
  },
  {
    label: 'OPTIONS',
    value: HttpMethod.OPTIONS,
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

interface Props {
  isEditor: boolean;
}

export const HttpSettingsForm: FC<Props> = ({ isEditor }) => {
  const { register, watch, control, errors } = useFormContext();
  const [showHttpSettings, setShowHttpSettings] = useState(false);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bearerToken = watch('settings.http.bearerToken');
  const basicAuth = watch('settings.http.basicAuth');
  const [includeBearerToken, setIncludeBearerToken] = useState(Boolean(bearerToken));
  const [includeBasicAuth, setIncludeBasicAuth] = useState(Boolean(basicAuth));

  return (
    <Container>
      <Collapse
        label="HTTP Settings"
        onToggle={() => setShowHttpSettings(!showHttpSettings)}
        isOpen={showHttpSettings}
        collapsible
      >
        <HorizontalGroup>
          <Field
            label="Request Method"
            description="The HTTP method the probe will use"
            disabled={!isEditor}
            invalid={Boolean(errors?.settings?.http?.method)}
            error={errors?.settings?.http?.method}
          >
            <Controller
              as={Select}
              rules={{ required: true }}
              name="settings.http.method"
              options={methodOptions}
              defaultValue={methodOptions[0]}
            />
          </Field>
        </HorizontalGroup>
        <Container>
          <Field
            label="Request Body"
            description="The body of the HTTP request used in probe."
            disabled={!isEditor}
            invalid={Boolean(errors?.settings?.http?.body)}
            error={errors?.settings?.http?.body}
          >
            <TextArea
              id="http-settings-request-body"
              ref={register({ validate: validateHTTPBody })}
              name="settings.http.body"
              rows={2}
              disabled={!isEditor}
            />
          </Field>
        </Container>
        <Container>
          <Field label="Request Headers" description="The HTTP headers set for the probe.." disabled={!isEditor}>
            <NameValueInput
              name="settings.http.headers"
              disabled={!isEditor}
              label="Header"
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
          <Field
            label="Bearer Token"
            description="Include bearer Authorization header in request"
            disabled={!isEditor}
            horizontal={true}
            className={
              !includeBearerToken
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
          >
            <Container margin="sm">
              <Switch
                value={includeBearerToken}
                onChange={() => setIncludeBearerToken(!includeBearerToken)}
                disabled={!isEditor}
              />
            </Container>
          </Field>
          {includeBearerToken && (
            <Field invalid={Boolean(errors.settings?.http?.bearerToken)} error={errors.settings?.http?.bearerToken}>
              <Input
                ref={register({
                  validate: validateBearerToken,
                })}
                name="settings.http.bearerToken"
                type="password"
                placeholder="Bearer Token"
                disabled={!isEditor}
              />
            </Field>
          )}
        </VerticalGroup>
        <VerticalGroup spacing="xs">
          <Field
            label="Basic Auth"
            description="Include Basic Authorization header in request"
            disabled={!isEditor}
            horizontal={true}
            className={
              !includeBasicAuth
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
          >
            <Container margin="sm">
              <Switch
                value={includeBasicAuth}
                onChange={() => setIncludeBasicAuth(!includeBasicAuth)}
                disabled={!isEditor}
              />
            </Container>
          </Field>
          {includeBasicAuth && (
            <HorizontalGroup>
              <Input
                ref={register()}
                name="settings.http.basicAuth.username"
                type="text"
                placeholder="username"
                disabled={!isEditor}
              />
              <Input
                ref={register()}
                name="settings.http.basicAuth.password"
                type="password"
                placeholder="password"
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
        <HorizontalGroup>
          <Field
            label="Valid Status Codes"
            description="Accepted status codes for this probe. Defaults to 2xx."
            disabled={!isEditor}
          >
            <Controller
              as={MultiSelect}
              control={control}
              name="settings.http.validStatusCodes"
              options={validStatusCodes}
              disabled={!isEditor}
            />
          </Field>
          <Field label="Valid HTTP Versions" description="Accepted HTTP versions for this probe" disabled={!isEditor}>
            <Controller
              as={MultiSelect}
              control={control}
              name="settings.http.validHTTPVersions"
              options={httpVersionOptions}
              disabled={!isEditor}
            />
          </Field>

          <Field
            label="SSL Options"
            description="Choose whether probe fails if SSL is present or not present"
            disabled={!isEditor}
          >
            <Controller
              as={Select}
              name="settings.http.sslOptions"
              control={control}
              options={HTTP_SSL_OPTIONS}
              disabled={!isEditor}
            />
          </Field>

          {/* <Field label="Fail if SSL" description="Probe fails if SSL is present" disabled={!isEditor}>
            <Switch id="http-settings-fail-ssl" ref={register} name="settings.http.failIfSSL" disabled={!isEditor} />
          </Field>
          <Field label="Fail if not SSL" description="Probe fails if SSL is not present" disabled={!isEditor}>
            <Switch
              id="http-settings-fail-not-ssl"
              ref={register}
              name="settings.http.failIfNotSSL"
              disabled={!isEditor}
            />
          </Field> */}
        </HorizontalGroup>
        <BodyRegexMatcherInput
          label="Fail if body matches regexp"
          description="Probe fails if response body matches regex"
          name="settings.http.failIfBodyMatchesRegexp"
          isEditor={isEditor}
        />
        <BodyRegexMatcherInput
          label="Fail if body doesn't match regexp"
          description="Probe fails if response body does not match regex"
          name="settings.http.failIfBodyNotMatchesRegexp"
          isEditor={isEditor}
        />
        <HeaderRegexMatcherInput
          label="Fail if header matches regexp"
          description="Probe fails if response header matches regex. For headers with multiple values, fails if *at least one* matches"
          name="settings.http.failIfHeaderMatchesRegexp"
          isEditor={isEditor}
        />

        <HeaderRegexMatcherInput
          label="Fail if header doesn't match regexp"
          description="Probe fails if response header does not match regex. For headers with multiple values, fails if *none* match."
          name="settings.http.failIfHeaderNotMatchesRegexp"
          isEditor={isEditor}
        />
      </Collapse>
      <Collapse
        label="Advanced Options"
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
        collapsible
      >
        <LabelField isEditor={isEditor} />
        <HorizontalGroup>
          <div>
            <Field label="IP Version" description="The IP protocol of the HTTP request" disabled={!isEditor}>
              <Controller as={Select} name="settings.http.ipVersion" options={IP_OPTIONS} />
            </Field>
          </div>
          <div>
            <Field
              label="Follow Redirects"
              description="Whether or not the probe will follow any redirects."
              disabled={!isEditor}
            >
              <Switch
                id="http-settings-follow-redirects"
                ref={register}
                name="settings.http.noFollowRedirects"
                disabled={!isEditor}
              />
            </Field>
          </div>
        </HorizontalGroup>
        <HorizontalGroup>
          <Field
            label="Cache busting query parameter name"
            description="The name of the query parameter used to prevent the server from using a cached response. Each probe will assign a random value to this parameter each time a request is made."
          >
            <Input
              id="https-settings-cache-busting-query"
              ref={register}
              name="settings.http.cacheBustingQueryParamName"
              type="string"
              placeholder="cache-bust"
              disabled={!isEditor}
            />
          </Field>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};
