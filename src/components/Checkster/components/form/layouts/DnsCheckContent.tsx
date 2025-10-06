import React from 'react';

import { DNS_PROTOCOLS } from 'components/constants';

import { DEFAULT_EXAMPLE_HOSTNAME } from '../../../constants';
import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormDnsRecordTypeField } from '../FormDnsRecordTypeField';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericInputField } from '../generic/GenericInputField';
import { GenericRadioButtonGroupField } from '../generic/GenericRadioButtonGroupField';

export function DnsCheckContent() {
  return (
    <SectionContent>
      <FormJobField field="job" />
      <ChooseCheckType />
      <GenericInputField
        field="target"
        label="Reuqest target"
        description="Name of record to query"
        placeholder={DEFAULT_EXAMPLE_HOSTNAME}
        required
      />

      <AdditionalSettings indent buttonLabel="Request options">
        <FormTabs>
          <FormTabContent label="Options">
            <FormIpVersionRadioField field="settings.dns.ipVersion" description="The IP protocol of the DNS request" />
            <FormDnsRecordTypeField field="settings.dns.recordType" />
            <GenericInputField field="settings.dns.server" label="Server" required />
            <GenericRadioButtonGroupField field="settings.dns.protocol" label="Protocol" options={DNS_PROTOCOLS} />
            <GenericInputField field="settings.dns.port" label="Port" required />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
