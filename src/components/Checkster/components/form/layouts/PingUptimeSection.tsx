import React from 'react';
import { Stack } from '@grafana/ui';

import { CHECK_TYPE_TIMEOUT_MAP, FIELD_SPACING } from '../../../constants';
import { FormTimeoutField } from '../FormTimeoutField';

export function PingUptimeSection() {
  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.ping} />
    </Stack>
  );
}
