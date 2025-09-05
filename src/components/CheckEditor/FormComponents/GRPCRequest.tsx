import React, { forwardRef } from 'react';

import { GRPCRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';
import { GRPCCheckService } from './GRPCCheckService';

interface GRPCRequestProps {
  disabled?: boolean;
  fields: GRPCRequestFields;
}

export const GRPCRequest = forwardRef<HandleErrorRef, GRPCRequestProps>(({ disabled, fields }, handleErrorRef) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com:50051`} />
      </Request.Field>
      <Request.Options ref={handleErrorRef}>
        <Request.Options.Section label={`Options`}>
          <CheckIpVersion
            description={`The IP protocol of the gRPC request`}
            disabled={disabled}
            name={fields.ipVersion.name}
          />
        </Request.Options.Section>
        <Request.Options.Section label={`Service`}>
          <GRPCCheckService disabled={disabled} />
        </Request.Options.Section>
        <Request.Options.Section label={`TLS Config`}>
          <CheckUseTLS checkType={CheckType.GRPC} disabled={disabled} />
          <TLSConfig disabled={disabled} fields={fields} />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
});

GRPCRequest.displayName = 'GRPCRequest';
