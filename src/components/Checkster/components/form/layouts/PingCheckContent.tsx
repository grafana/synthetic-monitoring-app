import React from 'react';

import { DEFAULT_EXAMPLE_HOSTNAME } from '../../../constants';
import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericCheckboxField } from '../generic/GenericCheckboxField';
import { GenericInputField } from '../generic/GenericInputField';

export function PingCheckContent() {
  return (
    <SectionContent>
      <FormJobField field="job" />
      <ChooseCheckType />
      <GenericInputField
        field="target"
        label="Request target"
        description="Send an ICMP echo request to a target."
        placeholder={DEFAULT_EXAMPLE_HOSTNAME}
        required
      />

      <AdditionalSettings indent buttonLabel="Request options">
        <FormTabs>
          <FormTabContent label="Options">
            <FormIpVersionRadioField
              field="settings.ping.ipVersion"
              description="The IP protocol of the ICMP request."
            />
            <GenericCheckboxField
              field="settings.ping.dontFragment"
              label="Do not fragment"
              description="Set the DF-bit in the IP-header. Only works with ipV4."
            />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
