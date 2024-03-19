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
import { CheckUsage } from 'components/CheckUsage';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckDNSLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <Collapse label="General settings" isOpen>
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.DNS} />
        <ProbeOptions checkType={CheckType.DNS} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </Collapse>
      <Collapse label="DNS settings">
        <div className={styles.maxWidth}>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </div>
      </Collapse>
      <Collapse label="Validation">
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
      </Collapse>
      <Collapse label="Advanced options">
        <div className={styles.maxWidth}>
          <LabelField<CheckFormValuesPing> />
          <CheckIpVersion checkType={CheckType.DNS} name="settings.dns.ipVersion" />
        </div>
      </Collapse>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  maxWidth: css({
    maxWidth: `500px`,
  }),
});
