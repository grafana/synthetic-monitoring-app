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
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPCheckUseTLS } from 'components/CheckEditor/FormComponents/TCPCheckUseTLS';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckUsage } from 'components/CheckUsage';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckTCPLayout = () => {
  const [showGeneralSettings, setShowGeneralSettings] = useState(true);
  const [showTCPSettings, setShowTCPSettings] = useState(false);
  const [showQueryResponse, setShowQueryResponse] = useState(false);
  const [showTLS, setShowTLS] = useState(false);
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
        <CheckTarget checkType={CheckType.TCP} />
        <ProbeOptions checkType={CheckType.TCP} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </Collapse>
      <Collapse label="TCP settings" onToggle={() => setShowTCPSettings(!showTCPSettings)} isOpen={showTCPSettings}>
        <div className={styles.maxWidth}>
          <TCPCheckUseTLS />
        </div>
      </Collapse>
      <Collapse
        label="Query/Response"
        onToggle={() => setShowQueryResponse(!showQueryResponse)}
        isOpen={showQueryResponse}
      >
        <div className={styles.maxWidth}>
          <TCPCheckQueryAndResponse />
        </div>
      </Collapse>
      <Collapse label="TLS config" onToggle={() => setShowTLS(!showTLS)} isOpen={showTLS}>
        <TLSConfig checkType={CheckType.TCP} />
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
