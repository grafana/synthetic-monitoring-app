import React from 'react';

import { PingRequestFields } from '../CheckEditor.types';
import { Request } from 'components/Request';

import { CheckIpVersion } from './CheckIpVersion';
import { PingCheckFragment } from './PingCheckFragment';

export const PingRequest = ({ fields }: { fields: PingRequestFields }) => {
  return (
    <Request>
      <Request.Field description={`Send an ICMP echo request to a target`} name={fields.target.name}>
        <Request.Input placeholder={`grafana.com`} />
        <Request.Test />
      </Request.Field>
      <Request.Options>
        <Request.Options.Section label={`Options`}>
          <CheckIpVersion description={`The IP protocol of the ICMP request`} name={fields.ipVersion.name} />
          <PingCheckFragment name={fields.dontFragment.name} />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
};
