import React from 'react';
import { useHistory } from 'react-router-dom';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormTypeLayoutProps, CheckFormValuesHttp, CheckType, CheckTypeGroup } from 'types';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
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
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckFields = ({
  formActions,
  onSubmit,
  onSubmitError,
  errorMessage,
  schema,
  checkType,
}: CheckFormTypeLayoutProps) => {
  const options = useCheckTypeOptions();
  const styles = useStyles2(getStyles);
  const history = useHistory();

  return (
    <FormLayout
      formActions={formActions}
      onSubmit={onSubmit}
      onSubmitError={onSubmitError}
      errorMessage={errorMessage}
      schema={schema}
    >
      <FormLayout.Section
        label="Define check"
        fields={[
          `job`,
          `target`,
          `settings.http.method`,
          `settings.http.body`,
          `settings.http.headers`,
          `settings.http.compression`,
          `settings.http.proxyConnectHeaders`,
          `settings.http.tlsConfig.caCert`,
          `settings.http.tlsConfig.clientCert`,
          `settings.http.tlsConfig.clientKey`,
          `settings.http.tlsConfig.insecureSkipVerify`,
          `settings.http.tlsConfig.serverName`,
          `settings.http.bearerToken`,
          `settings.http.basicAuth.password`,
          `settings.http.basicAuth.username`,
        ]}
      >
        <div className={styles.stackCol}>
          <CheckJobName />
          <h3 className="h4">Request</h3>
          <div>
            <RadioButtonGroup
              options={options.filter((option) => option.group === CheckTypeGroup.ApiTest)}
              value={checkType}
              onChange={(value) => {
                history.replace({ search: `?checkType=${value}` });
              }}
            />
          </div>
          <SubSectionContent />
        </div>
      </FormLayout.Section>
      <FormLayout.Section
        label="Define uptime"
        fields={[
          `settings.http.validStatusCodes`,
          `settings.http.validHTTPVersions`,
          `settings.http.sslOptions`,
          `settings.http.regexValidations`,
          `alertSensitivity`,
        ]}
      >
        <HttpCheckValidStatusCodes />
        <HttpCheckValidHttpVersions />
        <HttpCheckSSLOptions />
        <HttpCheckRegExValidation />
        <HttpCheckCompressionOption />
        <Timeout checkType={CheckType.HTTP} />
      </FormLayout.Section>

      <FormLayout.Section
        label="Probes"
        fields={[`probes`, `frequency`, `timeout`, `settings.http.cacheBustingQueryParamName`]}
      >
        <ProbeOptions checkType={CheckType.HTTP} />
        <CheckPublishedAdvanceMetrics />
        <HttpCheckCacheBuster />
        <CheckUsage checkType={CheckType.HTTP} />
      </FormLayout.Section>
      <FormLayout.Section label="Labels" fields={[`labels`]}>
        <LabelField<CheckFormValuesHttp> labelDestination="check" />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
      <FormLayout.Section label="Test & Review">Test the form?</FormLayout.Section>
    </FormLayout>
  );
};

enum SubSections {
  Request = 'Request',
  Settings = 'HTTP Settings',
  TLS = `TLS Config`,
  Proxy = `Proxy`,
}

const SubSectionContent = () => {
  const [activeTab, setActiveTab] = React.useState(SubSections.Request);

  return (
    <>
      <TabsBar>
        {Object.values(SubSections).map((section) => (
          <Tab key={section} label={section} onChangeTab={() => setActiveTab(section)} active={activeTab === section} />
        ))}
      </TabsBar>
      <TabContent>
        {activeTab === SubSections.Request && (
          <>
            <CheckTarget />
            <HttpCheckFollowRedirects />
            <CheckIpVersion checkType={CheckType.HTTP} name="settings.http.ipVersion" />
          </>
        )}
        {activeTab === SubSections.Settings && (
          <>
            <RequestMethodSelect name="settings.http.method" />
            <RequestBodyTextArea name="settings.http.body" />
            <HttpCheckBearerToken />
            <HttpCheckBasicAuthorization />
            <RequestHeaders
              description="The HTTP headers set for the probe."
              label="Request header"
              name="settings.http.headers"
              data-fs-element="Request headers"
            />
          </>
        )}
        {activeTab === SubSections.TLS && <TLSConfig checkType={CheckType.HTTP} />}
        {activeTab === SubSections.Proxy && (
          <>
            <HttpCheckProxyURL />
            <RequestHeaders
              description="The HTTP headers sent to the proxy."
              label="Proxy connect header"
              name="settings.http.proxyConnectHeaders"
              data-fs-element="Proxy connect headers"
            />
          </>
        )}
      </TabContent>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
});
