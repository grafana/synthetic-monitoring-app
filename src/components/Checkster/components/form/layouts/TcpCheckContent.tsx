import React from 'react';

import { DEFAULT_EXAMPLE_HOSTNAME } from '../../../constants';
import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { FormTLSConfigField } from '../FormTLSConfigField';
import { GenericInputField } from '../generic/GenericInputField';

export function TcpCheckContent() {
  return (
    <SectionContent>
      <FormJobField field="job" />
      <ChooseCheckType />
      <GenericInputField
        field="target"
        label="Request target"
        description="Host:port to connect to."
        placeholder={`${DEFAULT_EXAMPLE_HOSTNAME}:80`}
        required
      />

      <AdditionalSettings indent buttonLabel="Request options">
        <FormTabs>
          <FormTabContent label="Options">
            <FormIpVersionRadioField field="settings.tcp.ipVersion" description="The IP protocol of the TCP request." />
          </FormTabContent>
          <FormTabContent label="TLS">
            <FormTLSConfigField field="settings.tcp" useTLS />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
