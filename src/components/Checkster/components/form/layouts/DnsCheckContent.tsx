import React from 'react';

import { DNS_PROTOCOLS, DNS_RECORD_TYPES } from 'components/constants';

import { DEFAULT_EXAMPLE_HOSTNAME } from '../../../constants';
import { useGetIndexFieldError } from '../../../hooks/useGetIndexFieldError';
import { useHasFieldsError } from '../../../hooks/useHasFieldsError';
import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericInputField } from '../generic/GenericInputField';
import { GenericInputSelectField } from '../generic/GenericInputSelectField';
import { GenericRadioButtonGroupField } from '../generic/GenericRadioButtonGroupField';

const DNS_REQUEST_OPTIONS_TAB_FIELDS = [['settings.dns.server', 'settings.dns.port']];

const DNS_CHECK_REQUEST_OPTIONS_FIELDS = DNS_REQUEST_OPTIONS_TAB_FIELDS.filter((field) => {
  return field !== undefined;
}).flat();

export const DNS_CHECK_FIELDS = ['job', 'target', ...DNS_CHECK_REQUEST_OPTIONS_FIELDS];

export function DnsCheckContent() {
  const hasRequestOptionError = useHasFieldsError(DNS_CHECK_REQUEST_OPTIONS_FIELDS);
  const tabIndexErrors = useGetIndexFieldError(DNS_REQUEST_OPTIONS_TAB_FIELDS);
  return (
    <SectionContent>
      <FormJobField field="job" />
      <ChooseCheckType />
      <GenericInputField
        field="target"
        label="Request target"
        description="Name of record to query"
        placeholder={DEFAULT_EXAMPLE_HOSTNAME}
        required
      />

      <AdditionalSettings indent buttonLabel="Request options" isOpen={hasRequestOptionError}>
        <FormTabs tabErrorIndexes={tabIndexErrors}>
          <FormTabContent label="Options">
            <FormIpVersionRadioField field="settings.dns.ipVersion" description="The IP protocol of the DNS request" />
            <GenericInputSelectField label="Record type" field="settings.dns.recordType" options={DNS_RECORD_TYPES} />
            <GenericInputField field="settings.dns.server" label="Server" required />
            <GenericRadioButtonGroupField field="settings.dns.protocol" label="Protocol" options={DNS_PROTOCOLS} />
            <GenericInputField field="settings.dns.port" type="number" label="Port" required />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
