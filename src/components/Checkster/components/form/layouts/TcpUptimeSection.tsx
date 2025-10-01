import React from 'react';
import { Stack } from '@grafana/ui';

import { CHECK_TYPE_TIMEOUT_MAP, FIELD_SPACING } from '../../../constants';
import { FormTcpQueryAndResponseField } from '../FormTcpQueryAndResponseField';
import { FormTimeoutField } from '../FormTimeoutField';

export function TcpUptimeSection() {
  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      <FormTcpQueryAndResponseField
        label="Query and response"
        description="The query sent in the TCP check and the expected associated response. StartTLS upgrades TCP connection to TLS."
        field="settings.tcp.queryResponse"
      />
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.tcp} />
    </Stack>
  );
}
