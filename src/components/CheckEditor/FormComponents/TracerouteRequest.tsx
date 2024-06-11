import React from 'react';

import { TracerouteRequestFields } from '../CheckEditor.types';
import { Request } from 'components/Request';

import { TracerouteMaxHops } from './TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from './TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from './TraceroutePTRLookup';

export const TracerouteRequest = ({ fields }: { fields: TracerouteRequestFields }) => {
  return (
    <Request>
      <Request.Field description={`Hostname to send traceroute`} name={fields.target.name}>
        <Request.Input placeholder={`grafana.com`} />
      </Request.Field>
      <Request.Options>
        <Request.Options.Section label={`Options`}>
          <TracerouteMaxHops />
          <TracerouteMaxUnknownHops />
          <TraceroutePTRLookup />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
};
