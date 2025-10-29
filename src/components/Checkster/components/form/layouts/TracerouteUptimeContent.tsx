import React from 'react';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormTimeoutField } from '../FormTimeoutField';

export function TracerouteUptimeContent() {
  return (
    <SectionContent>
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.traceroute} />
    </SectionContent>
  );
}
