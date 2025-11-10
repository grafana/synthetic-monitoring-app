import React from 'react';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormMultiHttpAssertionsField } from '../FormMultiHttpAssertionsField';
import { FormTimeoutField } from '../FormTimeoutField';

export function MultiHttpUptimeContent() {
  return (
    <SectionContent>
      <FormMultiHttpAssertionsField field="settings.multihttp.entries" />
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.multihttp} />
    </SectionContent>
  );
}
