import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesHttp, CheckType } from 'types';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { HttpCheckBasicAuthorization } from 'components/CheckEditor/FormComponents/HttpCheckBasicAuthorization';
import { HttpCheckBearerToken } from 'components/CheckEditor/FormComponents/HttpCheckBearerToken';
import { HttpCheckCacheBuster } from 'components/CheckEditor/FormComponents/HttpCheckCacheBuster';
import { HttpCheckCompressionOption } from 'components/CheckEditor/FormComponents/HttpCheckCompressionOption';
import { HttpCheckFollowRedirects } from 'components/CheckEditor/FormComponents/HttpCheckFollowRedirects';
import { HttpCheckProxyURL } from 'components/CheckEditor/FormComponents/HttpCheckProxyURL';
import { HttpCheckRegExValidation } from 'components/CheckEditor/FormComponents/HttpCheckRegExValidation';
import { HttpCheckSSLOptions } from 'components/CheckEditor/FormComponents/HttpCheckSSLOptions';
import { HttpCheckValidHttpVersions } from 'components/CheckEditor/FormComponents/HttpCheckValidHttpVersions';
import { HttpCheckValidStatusCodes } from 'components/CheckEditor/FormComponents/HttpCheckValidStatusCodes';
import { RequestBodyTextArea } from 'components/CheckEditor/FormComponents/RequestBodyTextArea';
import { RequestHeaders } from 'components/CheckEditor/FormComponents/RequestHeaders';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TLSConfig } from 'components/TLSConfig';

export const HttpCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesHttp>>> = {
  [LayoutSection.Check]: [
    {
      label: `Request Options`,
      fields: [`settings.http.headers`],
      Component: (
        <>
          <RequestHeaders
            description="The HTTP headers set for the probe."
            label="Request header"
            name="settings.http.headers"
            data-fs-element="Request headers"
          />
          <HttpCheckFollowRedirects />
          <CheckIpVersion checkType={CheckType.HTTP} name="settings.http.ipVersion" />
        </>
      ),
    },
    {
      label: `Request Body`,
      fields: [`settings.http.body`],
      Component: <RequestBodyTextArea name="settings.http.body" />,
    },
    {
      label: `Authentication`,
      fields: [`settings.http.bearerToken`, `settings.http.basicAuth`],
      Component: (
        <>
          <HttpCheckBearerToken />
          <HttpCheckBasicAuthorization />
        </>
      ),
    },
    {
      label: `TLS Config`,
      fields: [
        `settings.http.tlsConfig.caCert`,
        `settings.http.tlsConfig.clientCert`,
        `settings.http.tlsConfig.clientKey`,
      ],
      Component: <TLSConfig checkType={CheckType.HTTP} />,
    },
    {
      label: `Proxy`,
      fields: [`settings.http.proxyURL`, `settings.http.proxyConnectHeaders`],
      Component: (
        <>
          <HttpCheckProxyURL />
          <RequestHeaders
            description="The HTTP headers sent to the proxy."
            label="Proxy connect header"
            name="settings.http.proxyConnectHeaders"
            data-fs-element="Proxy connect headers"
          />
        </>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
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
  ],
  [LayoutSection.Probes]: [
    {
      label: ``,
      fields: [`settings.http.cacheBustingQueryParamName`],
      Component: (
        <>
          <CheckPublishedAdvanceMetrics />
        </>
      ),
    },
  ],
  [LayoutSection.Labels]: [],
  [LayoutSection.Alerting]: [],
  [LayoutSection.Review]: [],
};
