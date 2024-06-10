import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Field, Input, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { get } from 'lodash';

import { HttpRequestFields, TLSConfigFields } from '../CheckEditor.types';
import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { RequestOptions } from 'components/CheckForm/RequestOptions';
import { METHOD_OPTIONS } from 'components/constants';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { HttpCheckAuthentication } from './HttpCheckAuthentication';
import { HttpCheckFollowRedirects } from './HttpCheckFollowRedirects';
import { HttpCheckProxyURL } from './HttpCheckProxyURL';
import { RequestBodyContentEncoding } from './RequestBodyContentEncoding';
import { RequestBodyContentType } from './RequestBodyContentType';
import { RequestBodyTextArea } from './RequestBodyTextArea';
import { RequestHeaders } from './RequestHeaders';

export const HttpRequest = ({ fields }: { fields: HttpRequestFields }) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control, formState, register } = useFormContext<CheckFormValues>();
  const targetField = register(fields.target.name);
  const targetFieldError = get(formState.errors, fields.target.name)?.message;
  const id = `request-method-${fields.method.name}`;
  const styles = useStyles2(getStyles);
  const [showPlaceholder, setShowplaceholder] = useState(true);

  return (
    <div className={styles.stackCol}>
      <Field
        label="Request target"
        description={`Full URL to send requests to`}
        disabled={!isEditor}
        data-fs-element="Check request target select"
        htmlFor={id}
        className={styles.field}
      >
        <div className={styles.grid}>
          <Controller
            control={control}
            render={({ field }) => {
              const { ref, onChange, ...rest } = field;
              return (
                <div>
                  <Select
                    {...rest}
                    options={METHOD_OPTIONS}
                    aria-label={fields.method['aria-label']}
                    onChange={({ value }) => onChange(value)}
                  />
                </div>
              );
            }}
            name={fields.method.name}
          />
          <Field className={styles.field} invalid={Boolean(targetFieldError)} error={targetFieldError}>
            <Input
              id={id}
              data-fs-element="Target input"
              placeholder={showPlaceholder ? `https://grafana.com/` : ``}
              onFocus={() => setShowplaceholder(false)}
              {...targetField}
              onChange={(e) => {
                targetField.onChange(e);
                fields.target.onChange?.(e);
              }}
              onBlur={(e) => {
                setShowplaceholder(true);
                targetField.onBlur(e);
              }}
            />
          </Field>
        </div>
      </Field>
      <HttpRequestOptions fields={fields} />
    </div>
  );
};

const HttpRequestOptions = ({ fields }: { fields: HttpRequestFields }) => {
  const requestHeadersName = fields.requestHeaders.name;
  const followRedirectsName = fields.followRedirects?.name;
  const ipVersionName = fields.ipVersion?.name;
  const requestBodyName = fields.requestBody?.name;
  const requestContentTypeName = fields.requestContentType?.name;
  const requestContentEncodingName = fields.requestContentEncoding?.name;
  const tlsFields = getTLSFields(fields);
  const proxyFields = getProxyFields(fields);

  return (
    <RequestOptions>
      <RequestOptions.Section label={`Request Options`}>
        <RequestHeaders
          description="The HTTP headers set for the probe."
          label="Request header"
          name={requestHeadersName}
          data-fs-element="Request headers"
        />
        {followRedirectsName && <HttpCheckFollowRedirects name={followRedirectsName} />}
        {ipVersionName && <CheckIpVersion description={`The IP protocol of the HTTP request`} name={ipVersionName} />}
      </RequestOptions.Section>
      <RequestOptions.Section label={`Request Body`}>
        {requestContentTypeName && <RequestBodyContentType name={requestContentTypeName} />}
        {requestContentEncodingName && <RequestBodyContentEncoding name={requestContentEncodingName} />}
        <RequestBodyTextArea name={requestBodyName} />
      </RequestOptions.Section>
      <RequestOptions.Section label={`Authentication`}>
        <div className={css({ display: `flex`, flexDirection: `column`, gap: `16px` })}>
          <div>
            <h3 className="h6">Authentication Type</h3>
            <HttpCheckAuthentication />
          </div>
          {tlsFields && (
            <div>
              <h3 className="h6">TLS Config</h3>
              <TLSConfig fields={tlsFields} />
            </div>
          )}
        </div>
      </RequestOptions.Section>
      {proxyFields && proxyFields.headers && proxyFields.url && (
        <RequestOptions.Section label={`Proxy`}>
          <HttpCheckProxyURL name={proxyFields.url.name} />
          <RequestHeaders
            description="The HTTP headers sent to the proxy."
            label="Proxy connect header"
            name={proxyFields.headers.name}
            data-fs-element="Proxy connect headers"
          />
        </RequestOptions.Section>
      )}
    </RequestOptions>
  );
};

function getTLSFields(fields: HttpRequestFields): TLSConfigFields | null {
  if (
    !fields.tlsServerName &&
    !fields.tlsInsecureSkipVerify &&
    !fields.tlsCaSCert &&
    !fields.tlsClientCert &&
    !fields.tlsClientKey
  ) {
    return null;
  }

  return {
    tlsServerName: fields.tlsServerName,
    tlsInsecureSkipVerify: fields.tlsInsecureSkipVerify,
    tlsCaSCert: fields.tlsCaSCert,
    tlsClientCert: fields.tlsClientCert,
    tlsClientKey: fields.tlsClientKey,
  };
}

function getProxyFields(fields: HttpRequestFields) {
  if (!fields.proxyUrl && !fields.proxyHeaders) {
    return null;
  }

  return {
    url: fields.proxyUrl,
    headers: fields.proxyHeaders,
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css({
    display: `grid`,
    gridTemplateColumns: `110px 1fr`,
  }),
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    gap: theme.spacing(2),
  }),
  field: css({
    margin: 0,
  }),
});
