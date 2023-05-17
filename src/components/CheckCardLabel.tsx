import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import React from 'react';
import { Label } from 'types';
import { css, cx } from '@emotion/css';

interface Props {
  label: Label;
  onLabelSelect: (label: Label) => void;
  className?: string;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: #9933cc;
    border-radius: 1px;
    max-width: 600px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
});

export const CheckCardLabel = ({ label, onLabelSelect, className }: Props) => {
  const styles = useStyles2(getStyles);
  return (
    <Tag
      onClick={() => onLabelSelect(label)}
      name={`${label.name}: ${label.value}`}
      className={cx(styles.container, className)}
    />
  );
};
