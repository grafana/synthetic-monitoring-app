import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { DNSRequestFields } from '../CheckEditor.types';
import { RequestOptions } from 'components/CheckForm/RequestOptions';

import { CheckIpVersion } from './CheckIpVersion';
import { DNSCheckRecordPort } from './DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from './DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from './DNSCheckRecordServer';
import { DNSCheckRecordType } from './DNSCheckRecordType';
import { RequestTargetInput } from './RequestTargetInput';

export const DNSRequest = ({ fields }: { fields: DNSRequestFields }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stackCol}>
      <RequestTargetInput
        name={fields.target.name}
        placeholder={`example.com`}
        description={`Name of record to query`}
      />
      <DNSRequestOptions fields={fields} />
    </div>
  );
};

const DNSRequestOptions = ({ fields }: { fields: DNSRequestFields }) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <RequestOptions>
      <RequestOptions.Section label={`Request Options`}>
        <CheckIpVersion description={`The IP protocol of the ICMP request`} name={ipVersionName} />
      </RequestOptions.Section>
      <RequestOptions.Section label={`DNS Settings`}>
        <>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </>
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
