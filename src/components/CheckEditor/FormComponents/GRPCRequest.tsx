import React from 'react';

import { GRPCRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';
import { GRPCCheckService } from './GRPCCheckService';

export const GRPCRequest = ({ fields }: { fields: GRPCRequestFields }) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input placeholder={`grafana.com:50051`} />
        <Request.Test />
      </Request.Field>
      <GRPCRequestOptions fields={fields} />
    </Request>
  );
};

const GRPCRequestOptions = ({ fields }: { fields: GRPCRequestFields }) => {
  const ipVersionName = fields.ipVersion.name;

  return (
    <Request.Options>
      <Request.Options.Section label={`Options`}>
        <CheckIpVersion description={`The IP protocol of the gRPC request`} name={ipVersionName} />
      </Request.Options.Section>
      <Request.Options.Section label={`Service`}>
        <GRPCCheckService />
      </Request.Options.Section>
      <Request.Options.Section label={`Authentication`}>
        <CheckUseTLS checkType={CheckType.GRPC} />
        <TLSConfig fields={fields} />
      </Request.Options.Section>
    </Request.Options>
  );
};
