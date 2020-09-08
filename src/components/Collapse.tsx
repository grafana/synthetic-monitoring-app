import React, { FC } from 'react';
import { Collapse as GrafanaCollapse } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  isOpen?: boolean;
  label: string;
  loading?: boolean;
  collapsible?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const Collapse: FC<Props> = props => (
  <div
    className={css`
      .panel-container {
        border-right: none;
        border-left: none;
        border-bottom: none;
      }
      .panel-container :first-child {
        padding-left: 0px;
      }
    `}
  >
    <GrafanaCollapse {...props} />
  </div>
);
