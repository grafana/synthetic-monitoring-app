import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Select, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HttpRequestFields, TLSConfigFields } from '../CheckEditor.types';
import { CheckFormValues, HttpMethod } from 'types';
import { getMethodColor, hasRole } from 'utils';
import { METHOD_OPTIONS } from 'components/constants';
import { Request } from 'components/Request';
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
  const { control } = useFormContext<CheckFormValues>();
  const id = `request-method-${fields.method.name}`;
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  return (
    <Request>
      <Request.Field
        label="Request target"
        description={`Full URL to send requests to`}
        disabled={!isEditor}
        data-fs-element="Check request target select"
        htmlFor={id}
        name={fields.target.name}
      >
        <div className={styles.grid}>
          <Controller
            control={control}
            render={({ field }) => {
              const { ref, onChange, ...rest } = field;
              const value = field.value as HttpMethod;

              return (
                <div>
                  <Select
                    {...rest}
                    className={css({
                      borderColor: getMethodColor(theme, value),
                    })}
                    options={METHOD_OPTIONS}
                    aria-label={fields.method['aria-label']}
                    onChange={({ value }) => onChange(value)}
                  />
                </div>
              );
            }}
            name={fields.method.name}
          />
          <Request.Input data-fs-element="Target input" placeholder={`https://grafana.com/`} />
          <Request.Test />
        </div>
      </Request.Field>
      <HttpRequestOptions fields={fields} />
    </Request>
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
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <RequestHeaders
          description="The HTTP headers set for the probe."
          label="Request header"
          name={requestHeadersName}
          data-fs-element="Request headers"
        />
        {followRedirectsName && <HttpCheckFollowRedirects name={followRedirectsName} />}
        {ipVersionName && <CheckIpVersion description={`The IP protocol of the HTTP request`} name={ipVersionName} />}
      </Request.Options.Section>
      <Request.Options.Section label={`Request Body`}>
        {requestContentTypeName && <RequestBodyContentType name={requestContentTypeName} />}
        {requestContentEncodingName && <RequestBodyContentEncoding name={requestContentEncodingName} />}
        <RequestBodyTextArea name={requestBodyName} />
      </Request.Options.Section>
      <Request.Options.Section label={`Authentication`}>
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
      </Request.Options.Section>
      {proxyFields && proxyFields.headers && proxyFields.url && (
        <Request.Options.Section label={`Proxy`}>
          <HttpCheckProxyURL name={proxyFields.url.name} />
          <RequestHeaders
            description="The HTTP headers sent to the proxy."
            label="Proxy connect header"
            name={proxyFields.headers.name}
            data-fs-element="Proxy connect headers"
          />
        </Request.Options.Section>
      )}
    </Request.Options>
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
    gridTemplateColumns: `110px 1fr auto`,
  }),
  method: css({}),
});
