import React from 'react';

import { DNSRequestFields } from '../CheckEditor.types';
import { Request } from 'components/Request';

import { CheckIpVersion } from './CheckIpVersion';
import { DNSCheckRecordPort } from './DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from './DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from './DNSCheckRecordServer';
import { DNSCheckRecordType } from './DNSCheckRecordType';

export const DNSRequest = ({ fields }: { fields: DNSRequestFields }) => {
  return (
    <Request>
      <Request.Field name={fields.target.name} description={`Name of record to query`}>
        <Request.Input placeholder={`Name of record to query`} />
        <Request.Test />
      </Request.Field>
      <DNSRequestOptions fields={fields} />
    </Request>
  );
};

const DNSRequestOptions = ({ fields }: { fields: DNSRequestFields }) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Request Options`}>
        <CheckIpVersion description={`The IP protocol of the ICMP request`} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`DNS Settings`}>
        <>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </>
      </Request.Options.Section>
    </Request.Options>
  );
};
