import React from 'react';

import { DNSRequestFields } from '../CheckEditor.types';
import { Request } from 'components/Request';

import { CheckIpVersion } from './CheckIpVersion';
import { DNSCheckRecordPort } from './DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from './DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from './DNSCheckRecordServer';
import { DNSCheckRecordType } from './DNSCheckRecordType';

interface DNSRequestProps {
  disabled?: boolean;
  fields: DNSRequestFields;
  onTest: () => void;
}

export const DNSRequest = ({ disabled, fields, onTest }: DNSRequestProps) => {
  return (
    <Request>
      <Request.Field name={fields.target.name} description={`Name of record to query`}>
        <Request.Input disabled={disabled} placeholder={`grafana.com`} />
        <Request.Test onClick={onTest} />
      </Request.Field>
      <DNSRequestOptions disabled={disabled} fields={fields} />
    </Request>
  );
};

const DNSRequestOptions = ({ disabled, fields }: Omit<DNSRequestProps, 'onTest'>) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <CheckIpVersion description={`The IP protocol of the ICMP request`} disabled={disabled} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`DNS Settings`}>
        <DNSCheckRecordType disabled={disabled} />
        <DNSCheckRecordServer disabled={disabled} />
        <DNSCheckRecordProtocol disabled={disabled} />
        <DNSCheckRecordPort disabled={disabled} />
      </Request.Options.Section>
    </Request.Options>
  );
};
