import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { PingRequestFields } from '../CheckEditor.types';

import { CheckIpVersion } from './CheckIpVersion';
import { PingCheckFragment } from './PingCheckFragment';
import { RequestTargetInput } from './RequestTargetInput';

export const PingRequest = ({ fields }: { fields: PingRequestFields }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stackCol}>
      <RequestTargetInput name={fields.target.name} placeholder={`grafana.com`} description={`Hostname to ping`} />
      <CheckIpVersion description={`The IP protocol of the ICMP request`} name={fields.ipVersion.name} />
      <PingCheckFragment name={fields.dontFragment.name} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    gap: theme.spacing(2),
  }),
});
