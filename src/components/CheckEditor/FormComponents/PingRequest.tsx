import React, { forwardRef } from 'react';

import { PingRequestFields } from '../CheckEditor.types';
import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Request } from 'components/Request';

import { CheckIpVersion } from './CheckIpVersion';
import { PingCheckFragment } from './PingCheckFragment';

interface PingRequestProps {
  disabled?: boolean;
  fields: PingRequestFields;
}

export const PingRequest = forwardRef<HandleErrorRef, PingRequestProps>(({ disabled, fields }, handleErrorRef) => {
  return (
    <Request>
      <Request.Field description={`Send an ICMP echo request to a target`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com`} />
      </Request.Field>
      <Request.Options ref={handleErrorRef}>
        <Request.Options.Section label={`Options`}>
          <CheckIpVersion
            description={`The IP protocol of the ICMP request`}
            disabled={disabled}
            name={fields.ipVersion.name}
          />
          <PingCheckFragment disabled={disabled} name={fields.dontFragment.name} />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
});

PingRequest.displayName = 'PingRequest';
