import React from 'react';
import { useFormContext } from 'react-hook-form';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValues, CheckFormValuesHttp, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { HttpRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { HttpCheckCompressionOption } from 'components/CheckEditor/FormComponents/HttpCheckCompressionOption';
import { HttpCheckRegExValidation } from 'components/CheckEditor/FormComponents/HttpCheckRegExValidation';
import { HttpCheckSSLOptions } from 'components/CheckEditor/FormComponents/HttpCheckSSLOptions';
import { HttpCheckValidHttpVersions } from 'components/CheckEditor/FormComponents/HttpCheckValidHttpVersions';
import { HttpCheckValidStatusCodes } from 'components/CheckEditor/FormComponents/HttpCheckValidStatusCodes';
import { HttpRequest } from 'components/CheckEditor/FormComponents/HttpRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const HTTP_REQUEST_FIELDS: HttpRequestFields<CheckFormValuesHttp> = {
  target: {
    name: `target`,
  },
  method: {
    name: `settings.http.method`,
  },
  requestHeaders: {
    name: `settings.http.headers`,
    section: 0,
  },
  ipVersion: {
    name: `settings.http.ipVersion`,
    section: 0,
  },
  followRedirects: {
    name: `settings.http.followRedirects`,
    section: 0,
  },
  requestBody: {
    name: `settings.http.body`,
    section: 2,
  },
  basicAuth: {
    name: `settings.http.basicAuth`,
    section: 3,
  },
  bearerToken: {
    name: `settings.http.bearerToken`,
    section: 3,
  },
  tlsServerName: {
    name: `settings.http.tlsConfig.serverName`,
    section: 4,
  },
  tlsInsecureSkipVerify: {
    name: `settings.http.tlsConfig.insecureSkipVerify`,
    section: 4,
  },
  tlsCaSCert: {
    name: `settings.http.tlsConfig.caCert`,
    section: 4,
  },
  tlsClientCert: {
    name: `settings.http.tlsConfig.clientCert`,
    section: 4,
  },
  tlsClientKey: {
    name: `settings.http.tlsConfig.clientKey`,
    section: 4,
  },
  proxyUrl: {
    name: `settings.http.proxyURL`,
    section: 5,
  },
  proxyHeaders: {
    name: `settings.http.proxyConnectHeaders`,
    section: 5,
  },
};

const CheckHttpRequest = () => {
  const { formState } = useFormContext();
  const { handleErrorRef } = useNestedRequestErrors(HTTP_REQUEST_FIELDS);

  return <HttpRequest disabled={formState.disabled} fields={HTTP_REQUEST_FIELDS} ref={handleErrorRef} />;
};

export const HttpCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValues>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(HTTP_REQUEST_FIELDS).map((field) => field.name),
    Component: <CheckHttpRequest />,
  },
  [LayoutSection.Uptime]: {
    fields: [
      `settings.http.validStatusCodes`,
      `settings.http.validHTTPVersions`,
      `settings.http.sslOptions`,
      `settings.http.regexValidations`,
      `settings.http.compression`,
      `timeout`,
    ],
    Component: (
      <>
        <HttpCheckValidStatusCodes />
        <HttpCheckValidHttpVersions />
        <HttpCheckSSLOptions />
        <HttpCheckRegExValidation />
        <HttpCheckCompressionOption />
        <Timeout checkType={CheckType.HTTP} />
      </>
    ),
  },
  [LayoutSection.Probes]: {
    fields: [`settings.http.cacheBustingQueryParamName`],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
