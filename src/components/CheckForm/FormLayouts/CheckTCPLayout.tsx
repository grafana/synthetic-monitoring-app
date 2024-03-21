import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesPing, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPCheckUseTLS } from 'components/CheckEditor/FormComponents/TCPCheckUseTLS';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckTCPLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`, `publishAdvancedMetrics`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.TCP} />
        <ProbeOptions checkType={CheckType.TCP} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </FormLayout.Section>
      <FormLayout.Section label="TCP settings" fields={[`settings.tcp.tls`]}>
        <div className={styles.maxWidth}>
          <TCPCheckUseTLS />
        </div>
      </FormLayout.Section>
      <FormLayout.Section label="Query/Response" fields={[`settings.tcp.queryResponse`]}>
        <div className={styles.maxWidth}>
          <TCPCheckQueryAndResponse />
        </div>
      </FormLayout.Section>
      <FormLayout.Section label="TLS config" fields={[`settings.tcp.tlsConfig`]}>
        <TLSConfig checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="Advanced options" fields={[`labels`, `settings.dns.ipVersion`]}>
        <div className={styles.maxWidth}>
          <LabelField<CheckFormValuesPing> />
          <CheckIpVersion checkType={CheckType.DNS} name="settings.dns.ipVersion" />
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
