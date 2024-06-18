import React from 'react';

import { TCPRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';

export const TCPRequest = ({ fields }: { fields: TCPRequestFields }) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input placeholder={`grafana.com:80`} />
        <Request.Test onClick={() => console.log(`hook me up`)} />
      </Request.Field>
      <TCPRequestOptions fields={fields} />
    </Request>
  );
};

const TCPRequestOptions = ({ fields }: { fields: TCPRequestFields }) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <CheckIpVersion description={`The IP protocol of the TCP request`} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`TLS Config`}>
        <CheckUseTLS checkType={CheckType.TCP} />
        <TLSConfig fields={fields} />
      </Request.Options.Section>
    </Request.Options>
  );
};
