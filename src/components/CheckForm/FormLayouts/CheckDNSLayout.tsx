import React, { useState } from 'react';
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
  const [showGeneralSettings, setShowGeneralSettings] = useState(true);
  const [showDNSSettings, setShowDNSSettings] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const styles = useStyles2(getStyles);

  return (
    <>
      <Collapse
        label="General settings"
        onToggle={() => setShowGeneralSettings(!showGeneralSettings)}
        isOpen={showGeneralSettings}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.PING} />
        <ProbeOptions checkType={CheckType.PING} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </Collapse>
      <Collapse label="DNS settings" onToggle={() => setShowDNSSettings(!showDNSSettings)} isOpen={showDNSSettings}>
        <div className={styles.maxWidth}>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </div>
      </Collapse>
      <Collapse label="Validation" onToggle={() => setShowValidation(!showValidation)} isOpen={showValidation}>
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
      </Collapse>
      <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
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
