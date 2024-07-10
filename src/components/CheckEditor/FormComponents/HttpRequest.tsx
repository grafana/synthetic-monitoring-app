import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Select, Stack, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HttpRequestFields, TLSConfigFields } from '../CheckEditor.types';
import { HttpMethod } from 'types';
import { getMethodColor, hasRole, parseUrl } from 'utils';
import { METHOD_OPTIONS } from 'components/constants';
import { Indent } from 'components/Indent';
import { QueryParams } from 'components/QueryParams';
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
import { RequestQueryParams } from './RequestQueryParams';

interface HttpRequestProps {
  fields: HttpRequestFields;
  onTest: () => void;
}

export const HttpRequest = ({ fields, onTest }: HttpRequestProps) => {
  const [showQueryParams, setShowQueryParams] = useState(false);
  const isEditor = hasRole(OrgRole.Editor);
  const { control, setValue, watch } = useFormContext();
  const id = `request-method-${fields.method.name}`;
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const targetValue = watch(fields.target.name) as string;
  const parsedURL = parseUrl(targetValue);

  return (
    <Request>
      <Request.Field
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
                    aria-label={fields.method['aria-label'] || `Request method *`}
                    className={css({
                      borderColor: getMethodColor(theme, value),
                    })}
                    options={METHOD_OPTIONS}
                    onChange={({ value }) => onChange(value)}
                    tabSelectsValue={false}
                  />
                </div>
              );
            }}
            name={fields.method.name}
          />
          <Request.Input
            aria-label={fields.target['aria-label'] || `Request target *`}
            data-fs-element="Target input"
            placeholder={`https://grafana.com/`}
            suffix={
              <Tooltip content={`Manage query parameters`}>
                <button
                  aria-label={`Manage query parameters`}
                  aria-pressed={showQueryParams}
                  className={cx(styles.queryParams, { [styles.active]: showQueryParams })}
                  type="button"
                  onClick={() => setShowQueryParams((v) => !v)}
                >
                  ?=
                </button>
              </Tooltip>
            }
          />
          <Request.Test disabled={!parsedURL} onClick={onTest} />
        </div>
      </Request.Field>
      {showQueryParams && (
        <Indent>
          {parsedURL ? (
            <QueryParams target={parsedURL} onChange={(target: string) => setValue(fields.target.name, target)} />
          ) : (
            <div className={styles.provideURL}>Provide a valid URL to manage your query parameters.</div>
          )}
        </Indent>
      )}
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
  const authFields = fields.basicAuth || fields.bearerToken;
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
      {fields.queryParams && (
        <Request.Options.Section label={`Query Parameters`}>
          <RequestQueryParams
            description={`The query parameters sent with the request. These parameters reduce cardinality when displaying URLs in dashboards. If you need higher cardinality, add your query parameters to the "Request target" field instead.`}
            label={`Query parameter`}
            name={fields.queryParams.name}
            data-fs-element="Query parameters"
          />
        </Request.Options.Section>
      )}
      <Request.Options.Section label={`Request Body`}>
        {requestContentTypeName && <RequestBodyContentType name={requestContentTypeName} />}
        {requestContentEncodingName && <RequestBodyContentEncoding name={requestContentEncodingName} />}
        <RequestBodyTextArea name={requestBodyName} />
      </Request.Options.Section>
      {authFields && (
        <Request.Options.Section label={`Authentication`}>
          <Stack direction={`column`} gap={2}>
            <div>
              <h3 className="h6">Authentication Type</h3>
              <HttpCheckAuthentication />
            </div>
          </Stack>
        </Request.Options.Section>
      )}
      {tlsFields && (
        <Request.Options.Section label={`TLS Config`}>
          <TLSConfig fields={fields} />
        </Request.Options.Section>
      )}
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
    gridTemplateColumns: `110px 1fr auto auto`,
  }),
  queryParams: css({
    background: `transparent`,
    border: 0,
    padding: 0,
  }),
  active: css({
    color: theme.colors.primary.border,
  }),
  provideURL: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontStyle: `italic`,
  }),
});
