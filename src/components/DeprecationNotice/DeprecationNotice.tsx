import React from 'react';
import { Badge, Tooltip } from '@grafana/ui';

export function DeprecationNotice({ className }: { className?: string }) {
  return (
    <Tooltip content="This probe is deprecated and cannot be added to checks. Move existing checks to another location.">
      <span tabIndex={0} className={className}>
        <Badge color="orange" text="Deprecated" />
      </span>
    </Tooltip>
  );
}
