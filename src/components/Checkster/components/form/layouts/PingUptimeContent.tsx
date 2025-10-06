import React from 'react';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormTimeoutField } from '../FormTimeoutField';

export function PingUptimeContent() {
  return (
    <SectionContent>
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.ping} />
    </SectionContent>
  );
}
