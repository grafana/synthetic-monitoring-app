import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Label } from 'types';

interface CheckCardLabelProps {
  label: Label;
  onLabelSelect: (label: Label) => void;
  className?: string;
}

export const CheckCardLabel = ({ label, onLabelSelect, className }: CheckCardLabelProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Tag
      onClick={() => onLabelSelect(label)}
      name={`${label.name}: ${label.value}`}
      className={cx(styles.container, className)}
      colorIndex={3}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    max-width: 600px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
});
