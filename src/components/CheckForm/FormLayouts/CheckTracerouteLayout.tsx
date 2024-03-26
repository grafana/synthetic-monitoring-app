import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesTraceroute, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { TracerouteMaxHops } from 'components/CheckEditor/FormComponents/TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from 'components/CheckEditor/FormComponents/TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from 'components/CheckEditor/FormComponents/TraceroutePTRLookup';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckTracerouteLayout = () => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <Collapse label="General settings" isOpen>
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.Traceroute} />
        <ProbeOptions checkType={CheckType.Traceroute} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </Collapse>
      <Collapse label="Advanced options">
        <div className={styles.maxWidth}>
          <LabelField<CheckFormValuesTraceroute> />
          <TracerouteMaxHops />
          <TracerouteMaxUnknownHops />
          <TraceroutePTRLookup />
        </div>
      </Collapse>
      <Collapse label="Alerting">
        <CheckFormAlert />
      </Collapse>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  maxWidth: css({
    maxWidth: `500px`,
  }),
});
