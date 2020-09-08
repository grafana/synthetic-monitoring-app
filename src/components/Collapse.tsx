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

const containerStyles = css`
  .panel-container {
    border-right: none;
    border-left: none;
    border-bottom: none;
    margin-bottom: 0;
  }
  .panel-container > div:first-of-type {
    padding: 16px 0px;
  }
  .panel-container > div:nth-child(2) {
    padding: 0 8px;
  }
`;

export const Collapse: FC<Props> = ({ isOpen, ...props }) => (
  <div className={containerStyles}>
    <GrafanaCollapse isOpen={isOpen} {...props} />
  </div>
);
