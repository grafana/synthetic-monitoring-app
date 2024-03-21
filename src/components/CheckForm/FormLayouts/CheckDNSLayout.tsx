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
import { DNSCheckRecordPort } from 'components/CheckEditor/FormComponents/DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from 'components/CheckEditor/FormComponents/DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from 'components/CheckEditor/FormComponents/DNSCheckRecordServer';
import { DNSCheckRecordType } from 'components/CheckEditor/FormComponents/DNSCheckRecordType';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckDNSLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.DNS} />
        <ProbeOptions checkType={CheckType.DNS} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </FormLayout.Section>
      <FormLayout.Section
        label="DNS settings"
        fields={[`settings.dns.recordType`, `settings.dns.server`, `settings.dns.protocol`, `settings.dns.port`]}
      >
        <div className={styles.maxWidth}>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </div>
      </FormLayout.Section>
      <FormLayout.Section label="Validation" fields={[`settings.dns.validRCodes`, `settings.dns.validations`]}>
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
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
