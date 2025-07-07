import React, { forwardRef } from 'react';

import { TCPRequestFields } from '../CheckEditor.types';
import { CheckType } from 'types';
import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Request } from 'components/Request';
import { TLSConfig } from 'components/TLSConfig';

import { CheckIpVersion } from './CheckIpVersion';
import { CheckUseTLS } from './CheckUseTLS';

interface TCPRequestProps {
  disabled?: boolean;
  fields: TCPRequestFields;
}

export const TCPRequest = forwardRef<HandleErrorRef, TCPRequestProps>(({ disabled, fields }, handleErrorRef) => {
  return (
    <Request>
      <Request.Field description={`Host:port to connect to`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com:80`} />
      </Request.Field>

      <Request.Options ref={handleErrorRef}>
        <Request.Options.Section label={`Options`}>
          <CheckIpVersion
            disabled={disabled}
            description={`The IP protocol of the TCP request`}
            name={fields.ipVersion.name}
          />
        </Request.Options.Section>
        <Request.Options.Section label={`TLS Config`}>
          <CheckUseTLS checkType={CheckType.TCP} disabled={disabled} />
          <TLSConfig disabled={disabled} fields={fields} />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
});

TCPRequest.displayName = 'TCPRequest';
