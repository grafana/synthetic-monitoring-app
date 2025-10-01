import React from 'react';
import { Stack } from '@grafana/ui';

import { DEFAULT_EXAMPLE_HOSTNAME, FIELD_SPACING } from '../../../constants';
import { AdditionalSettings } from '../../AdditionalSettings';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericCheckboxField } from '../generic/GenericCheckboxField';
import { GenericInputField } from '../generic/GenericInputField';

export function TracerouteCheckSection() {
  return (
    <>
      <h2>Request</h2>
      <Stack direction="column" gap={FIELD_SPACING}>
        <FormJobField field="job" />
        <ChooseCheckType />

        <GenericInputField
          field="target"
          label="Request target"
          description="Hostname to send traceroute."
          placeholder={DEFAULT_EXAMPLE_HOSTNAME}
          required
        />

        <AdditionalSettings indent buttonLabel="Request options">
          <FormTabs>
            <FormTabContent label="Options">
              <GenericInputField
                field="settings.traceroute.maxHops"
                label="Max hops"
                description="Maximum TTL for the trace."
              />
              <GenericInputField
                field="settings.traceroute.maxUnknownHops"
                label="Max unknown hops"
                description="Maximimum number of hosts to traverse that give no response."
              />
              <GenericCheckboxField
                field="settings.traceroute.ptrLookup"
                label="PTR lookup"
                description="Reverse lookup hostnames from IP addresses."
              />
            </FormTabContent>
          </FormTabs>
        </AdditionalSettings>
      </Stack>
    </>
  );
}
