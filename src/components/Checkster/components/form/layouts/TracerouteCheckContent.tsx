import React from 'react';

import { DEFAULT_EXAMPLE_HOSTNAME } from '../../../constants';
import { useGetIndexFieldError } from '../../../hooks/useGetIndexFieldError';
import { useHasFieldsError } from '../../../hooks/useHasFieldsError';
import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericCheckboxField } from '../generic/GenericCheckboxField';
import { GenericInputField } from '../generic/GenericInputField';

const REQUEST_OPTIONS_TAB_FIELDS = [
  [/\.maxHops/, /\.maxUnknownHops/], // Options
];

const REQUEST_OPTIONS_FIELDS = REQUEST_OPTIONS_TAB_FIELDS.filter((field) => {
  return field !== undefined;
}).flat();

export const TRACEROUTE_CHECK_FIELDS = ['job', 'target', ...REQUEST_OPTIONS_FIELDS];

export function TracerouteCheckContent() {
  const hasRequestOptionError = useHasFieldsError(REQUEST_OPTIONS_FIELDS);
  const tabIndexErrors = useGetIndexFieldError(REQUEST_OPTIONS_TAB_FIELDS);

  return (
    <SectionContent>
      <FormJobField field="job" />
      <ChooseCheckType />

      <GenericInputField
        field="target"
        label="Request target"
        description="Hostname to send traceroute."
        placeholder={DEFAULT_EXAMPLE_HOSTNAME}
        required
      />

      <AdditionalSettings indent buttonLabel="Request options" isOpen={hasRequestOptionError}>
        <FormTabs tabErrorIndexes={tabIndexErrors}>
          <FormTabContent label="Options">
            <GenericInputField
              field="settings.traceroute.maxHops"
              label="Max hops"
              description="Maximum TTL for the trace."
              type="number"
            />
            <GenericInputField
              field="settings.traceroute.maxUnknownHops"
              label="Max unknown hops"
              description="Maximimum number of hosts to traverse that give no response."
              type="number"
            />
            <GenericCheckboxField
              field="settings.traceroute.ptrLookup"
              label="PTR lookup"
              description="Reverse lookup hostnames from IP addresses."
            />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
