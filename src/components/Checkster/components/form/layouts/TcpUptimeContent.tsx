import React from 'react';

import { CHECK_TYPE_TIMEOUT_MAP } from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormTcpQueryAndResponseField } from '../FormTcpQueryAndResponseField';
import { FormTimeoutField } from '../FormTimeoutField';

export function TcpUptimeContent() {
  return (
    <SectionContent>
      <FormTcpQueryAndResponseField
        label="Query and response"
        description="The query sent in the TCP check and the expected associated response. StartTLS upgrades TCP connection to TLS."
        field="settings.tcp.queryResponse"
      />
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.tcp} />
    </SectionContent>
  );
}
