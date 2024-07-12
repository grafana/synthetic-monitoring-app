import React from 'react';

import { GRPCRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';
import { GRPCCheckService } from './GRPCCheckService';

interface GRPCRequestProps {
  disabled?: boolean;
  fields: GRPCRequestFields;
  onTest: () => void;
}

export const GRPCRequest = ({ disabled, fields, onTest }: GRPCRequestProps) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com:50051`} />
        <Request.Test onClick={onTest} />
      </Request.Field>
      <GRPCRequestOptions disabled={disabled} fields={fields} />
    </Request>
  );
};

const GRPCRequestOptions = ({ disabled, fields }: Omit<GRPCRequestProps, 'onTest'>) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <CheckIpVersion description={`The IP protocol of the gRPC request`} disabled={disabled} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`Service`}>
        <GRPCCheckService disabled={disabled} />
      </Request.Options.Section>
      <Request.Options.Section label={`TLS Config`}>
        <CheckUseTLS checkType={CheckType.GRPC} disabled={disabled} />
        <TLSConfig disabled={disabled} fields={fields} />
      </Request.Options.Section>
    </Request.Options>
  );
};
