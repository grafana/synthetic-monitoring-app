import React, { forwardRef } from 'react';

import { TracerouteRequestFields } from '../CheckEditor.types';
import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Request } from 'components/Request';

import { TracerouteMaxHops } from './TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from './TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from './TraceroutePTRLookup';

interface TracerouteRequestProps {
  disabled?: boolean;
  fields: TracerouteRequestFields;
}

export const TracerouteRequest = forwardRef<HandleErrorRef, TracerouteRequestProps>(
  ({ disabled, fields }, handleErrorRef) => {
    return (
      <Request>
        <Request.Field description={`Hostname to send traceroute`} name={fields.target.name}>
          <Request.Input disabled={disabled} placeholder={`grafana.com`} />
        </Request.Field>
        <Request.Options ref={handleErrorRef}>
          <Request.Options.Section label={`Options`}>
            <TracerouteMaxHops disabled={disabled} />
            <TracerouteMaxUnknownHops disabled={disabled} />
            <TraceroutePTRLookup disabled={disabled} />
          </Request.Options.Section>
        </Request.Options>
      </Request>
    );
  }
);

TracerouteRequest.displayName = 'TracerouteRequest';
