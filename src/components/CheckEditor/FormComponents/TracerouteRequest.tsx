import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TracerouteRequestFields } from '../CheckEditor.types';

import { RequestTargetInput } from './RequestTargetInput';
import { TracerouteMaxHops } from './TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from './TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from './TraceroutePTRLookup';

export const TracerouteRequest = ({ fields }: { fields: TracerouteRequestFields }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stackCol}>
      <RequestTargetInput
        name={fields.target.name}
        placeholder={`grafana.com`}
        description={`Hostname to send traceroute`}
      />
      <TracerouteMaxHops />
      <TracerouteMaxUnknownHops />
      <TraceroutePTRLookup />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    // gap: theme.spacing(1),
  }),
});
