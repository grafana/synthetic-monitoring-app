import React, { FC } from 'react';
import { Collapse as GrafanaCollapse, useTheme } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  isOpen?: boolean;
  label: string;
  loading?: boolean;
  collapsible?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const Collapse: FC<Props> = ({ isOpen, ...props }) => {
  const theme = useTheme();

  const containerStyles = css`
    .panel-container {
      border-right: none;
      border-left: none;
      border-bottom: none;
      margin-bottom: 0;
    }
    .panel-container > div:first-of-type {
      padding: ${theme.spacing.md} 0px;
    }
    .panel-container > div:nth-child(2) {
      padding: 0 ${theme.spacing.sm};
    }
  `;

  return (
    <div className={containerStyles}>
      <GrafanaCollapse isOpen={isOpen} {...props} />
    </div>
  );
};
