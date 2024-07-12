import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValues, CheckType } from 'types';
import { HttpRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { HttpCheckCompressionOption } from 'components/CheckEditor/FormComponents/HttpCheckCompressionOption';
import { HttpCheckRegExValidation } from 'components/CheckEditor/FormComponents/HttpCheckRegExValidation';
import { HttpCheckSSLOptions } from 'components/CheckEditor/FormComponents/HttpCheckSSLOptions';
import { HttpCheckValidHttpVersions } from 'components/CheckEditor/FormComponents/HttpCheckValidHttpVersions';
import { HttpCheckValidStatusCodes } from 'components/CheckEditor/FormComponents/HttpCheckValidStatusCodes';
import { HttpRequest } from 'components/CheckEditor/FormComponents/HttpRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

export const HTTP_REQUEST_FIELDS: HttpRequestFields = {
  target: {
    name: `target`,
  },
  method: {
    name: `settings.http.method`,
  },
  requestHeaders: {
    name: `settings.http.headers`,
  },
  ipVersion: {
    name: `settings.http.ipVersion`,
  },
  requestBody: {
    name: `settings.http.body`,
  },
  basicAuth: {
    name: `settings.http.basicAuth`,
  },
  bearerToken: {
    name: `settings.http.bearerToken`,
  },
  tlsServerName: {
    name: `settings.http.tlsConfig.serverName`,
  },
  tlsInsecureSkipVerify: {
    name: `settings.http.tlsConfig.insecureSkipVerify`,
  },
  tlsCaSCert: {
    name: `settings.http.tlsConfig.caCert`,
  },
  tlsClientCert: {
    name: `settings.http.tlsConfig.clientCert`,
  },
  tlsClientKey: {
    name: `settings.http.tlsConfig.clientKey`,
  },
  proxyUrl: {
    name: `settings.http.proxyURL`,
  },
  proxyHeaders: {
    name: `settings.http.proxyConnectHeaders`,
  },
};

const CheckHttpRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;

  const onTest = useCallback(() => {
    addRequest(HTTP_REQUEST_FIELDS);
  }, [addRequest]);

  return <HttpRequest disabled={isFormDisabled} fields={HTTP_REQUEST_FIELDS} onTest={onTest} />;
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
