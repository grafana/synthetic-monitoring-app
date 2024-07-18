import React, { forwardRef } from 'react';

import { DNSRequestFields } from '../CheckEditor.types';
import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Request } from 'components/Request';

import { CheckIpVersion } from './CheckIpVersion';
import { DNSCheckRecordPort } from './DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from './DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from './DNSCheckRecordServer';
import { DNSCheckRecordType } from './DNSCheckRecordType';

interface DNSRequestProps {
  disabled?: boolean;
  fields: DNSRequestFields;
  onTest: () => void;
}

export const DNSRequest = forwardRef<HandleErrorRef, DNSRequestProps>(
  ({ disabled, fields, onTest }, handleErrorRef) => {
    return (
      <Request>
        <Request.Field name={fields.target.name} description={`Name of record to query`}>
          <Request.Input disabled={disabled} placeholder={`grafana.com`} />
          <Request.Test onClick={onTest} />
        </Request.Field>
        <Request.Options ref={handleErrorRef}>
          <Request.Options.Section label={`Options`}>
            <CheckIpVersion
              description={`The IP protocol of the ICMP request`}
              disabled={disabled}
              name={fields.ipVersion.name}
            />
          </Request.Options.Section>
          <Request.Options.Section label={`DNS Settings`}>
            <DNSCheckRecordType disabled={disabled} />
            <DNSCheckRecordServer disabled={disabled} />
            <DNSCheckRecordProtocol disabled={disabled} />
            <DNSCheckRecordPort disabled={disabled} />
          </Request.Options.Section>
        </Request.Options>
      </Request>
    );
  }
);

DNSRequest.displayName = 'DNSRequest';
