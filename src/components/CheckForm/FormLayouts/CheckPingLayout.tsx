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
import { PingCheckFragment } from 'components/CheckEditor/FormComponents/PingCheckFragment';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckUsage } from 'components/CheckUsage';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckPingLayout = () => {
  const [showGeneralSettings, setShowGeneralSettings] = useState(true);
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
        <CheckTarget checkType={CheckType.HTTP} />
        <ProbeOptions checkType={CheckType.HTTP} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </Collapse>
      <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
        <div className={styles.maxWidth}>
          <LabelField<CheckFormValuesPing> />
          <CheckIpVersion checkType={CheckType.PING} name="settings.ping.ipVersion" />
          <PingCheckFragment />
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