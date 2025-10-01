import React from 'react';
import { Stack } from '@grafana/ui';

import { DEFAULT_EXAMPLE_HOSTNAME, FIELD_SPACING } from '../../../constants';
import { AdditionalSettings } from '../../AdditionalSettings';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { FormTLSConfigField } from '../FormTLSConfigField';
import { GenericInputField } from '../generic/GenericInputField';

export function GrpcCheckSection() {
  return (
    <>
      <h2>Request</h2>
      <Stack direction="column" gap={FIELD_SPACING}>
        <FormJobField field="job" />

        <ChooseCheckType />

        {/* TODO: Would be nice to write root fields like `.target` (instead of `target`) */}
        <GenericInputField
          field="target"
          label="Request target"
          description="Host:port to connect to"
          placeholder={`${DEFAULT_EXAMPLE_HOSTNAME}:50051`}
          required
        />

        <AdditionalSettings indent buttonLabel="Request options">
          <FormTabs>
            <FormTabContent label="Options">
              <GenericInputField
                field="settings.grpc.service"
                label="Service"
                description="Service to perform health check against."
              />
              <FormIpVersionRadioField
                field="settings.grpc.ipVersion"
                description="The IP protocol of the gRPC request"
              />
            </FormTabContent>

            <FormTabContent label="TLS">
              <FormTLSConfigField field="settings.grpc" useTLS />
            </FormTabContent>
          </FormTabs>
        </AdditionalSettings>
      </Stack>
    </>
  );
}
