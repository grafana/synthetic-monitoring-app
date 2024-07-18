import React from 'react';

import { TCPRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';

interface TCPRequestProps {
  disabled?: boolean;
  fields: TCPRequestFields;
  onTest: () => void;
}

export const TCPRequest = ({ disabled, fields, onTest }: TCPRequestProps) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com:80`} />
        <Request.Test onClick={onTest} />
      </Request.Field>
      <TCPRequestOptions disabled={disabled} fields={fields} />
    </Request>
  );
};

const TCPRequestOptions = ({ disabled, fields }: Omit<TCPRequestProps, 'onTest'>) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <CheckIpVersion disabled={disabled} description={`The IP protocol of the TCP request`} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`TLS Config`}>
        <CheckUseTLS checkType={CheckType.TCP} disabled={disabled} />
        <TLSConfig disabled={disabled} fields={fields} />
      </Request.Options.Section>
    </Request.Options>
  );
};
