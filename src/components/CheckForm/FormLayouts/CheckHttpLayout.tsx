import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesHttp, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
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
import { RequestMethodSelect } from 'components/CheckEditor/FormComponents/RequestMethodSelect';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckHTTPLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.HTTP} />
        <ProbeOptions checkType={CheckType.HTTP} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </FormLayout.Section>
      <FormLayout.Section
        label="HTTP settings"
        fields={[
          `settings.http.method`,
          `settings.http.body`,
          `settings.http.headers`,
          `settings.http.compression`,
          `settings.http.proxyConnectHeaders`,
        ]}
      >
        <RequestMethodSelect name="settings.http.method" />
        <RequestBodyTextArea name="settings.http.body" />
        <RequestHeaders
          description="The HTTP headers set for the probe."
          label="Request header"
          name="settings.http.headers"
        />
        <HttpCheckCompressionOption />
        <HttpCheckProxyURL />
        <RequestHeaders
          description="The HTTP headers sent to the proxy."
          label="Proxy connect header"
          name="settings.http.proxyConnectHeaders"
        />
      </FormLayout.Section>
      <FormLayout.Section
        label="TLS config"
        fields={[
          `settings.http.tlsConfig.caCert`,
          `settings.http.tlsConfig.clientCert`,
          `settings.http.tlsConfig.clientKey`,
          `settings.http.tlsConfig.insecureSkipVerify`,
          `settings.http.tlsConfig.serverName`,
        ]}
      >
        <TLSConfig checkType={CheckType.HTTP} />
      </FormLayout.Section>
      <FormLayout.Section
        label="Authentication"
        fields={[`settings.http.bearerToken`, `settings.http.basicAuth.password`, `settings.http.basicAuth.username`]}
      >
        <HttpCheckBearerToken />
        <HttpCheckBasicAuthorization />
      </FormLayout.Section>
      <FormLayout.Section
        label="Validation"
        fields={[`settings.http.validStatusCodes`, `settings.http.validHTTPVersions`, `settings.http.sslOptions`]}
      >
        <div className={styles.maxWidth}>
          <HttpCheckValidStatusCodes />
          <HttpCheckValidHttpVersions />
          <HttpCheckSSLOptions />
        </div>
        <HttpCheckRegExValidation />
      </FormLayout.Section>
      <FormLayout.Section
        label="Advanced options"
        fields={[
          `labels`,
          `settings.http.ipVersion`,
          `settings.http.followRedirects`,
          `settings.http.cacheBustingQueryParamName`,
        ]}
      >
        <div className={styles.maxWidth}>
          <LabelField<CheckFormValuesHttp> />
          <CheckIpVersion checkType={CheckType.HTTP} name="settings.http.ipVersion" />
          <HttpCheckFollowRedirects />
          <HttpCheckCacheBuster />
        </div>
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  maxWidth: css({
    maxWidth: `500px`,
  }),
});
