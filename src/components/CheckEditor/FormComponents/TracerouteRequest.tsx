import React from 'react';

import { TracerouteRequestFields } from '../CheckEditor.types';
import { Request } from 'components/Request';

import { TracerouteMaxHops } from './TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from './TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from './TraceroutePTRLookup';

interface TracerouteRequestProps {
  disabled?: boolean;
  fields: TracerouteRequestFields;
}

export const TracerouteRequest = ({ disabled, fields }: TracerouteRequestProps) => {
  return (
    <Request>
      <Request.Field description={`Hostname to send traceroute`} name={fields.target.name}>
        <Request.Input disabled={disabled} placeholder={`grafana.com`} />
      </Request.Field>
      <Request.Options>
        <Request.Options.Section label={`Options`}>
          <TracerouteMaxHops disabled={disabled} />
          <TracerouteMaxUnknownHops disabled={disabled} />
          <TraceroutePTRLookup disabled={disabled} />
        </Request.Options.Section>
      </Request.Options>
    </Request>
  );
};
