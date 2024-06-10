import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TCPRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { RequestOptions } from 'components/CheckForm/RequestOptions';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';
import { RequestTargetInput } from './RequestTargetInput';

export const TCPRequest = ({ fields }: { fields: TCPRequestFields }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stackCol}>
      <RequestTargetInput
        name={fields.target.name}
        placeholder={`grafana.com:80`}
        description={`Host:port to connect to`}
      />
      <TCPRequestOptions fields={fields} />
    </div>
  );
};

const TCPRequestOptions = ({ fields }: { fields: TCPRequestFields }) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <RequestOptions>
      <RequestOptions.Section label={`Request Options`}>
        <CheckIpVersion description={`The IP protocol of the TCP request`} name={ipVersionName} />
      </RequestOptions.Section>
      <RequestOptions.Section label={`Authentication`}>
        <CheckUseTLS checkType={CheckType.GRPC} />
        <TLSConfig fields={fields} />
      </RequestOptions.Section>
    </RequestOptions>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    gap: theme.spacing(2),
  }),
});
