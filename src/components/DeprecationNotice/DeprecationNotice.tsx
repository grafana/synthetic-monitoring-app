import React from 'react';
import { Badge, Tooltip } from '@grafana/ui';

export function DeprecationNotice() {
  return (
    <Tooltip content="This probe is deprecated and cannot be added to checks. Move existing checks to another location.">
      <span tabIndex={0}>
        <Badge color="orange" text="Deprecated" />
      </span>
    </Tooltip>
  );
}
