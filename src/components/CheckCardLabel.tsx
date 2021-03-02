import { GrafanaTheme } from '@grafana/data';
import { Tag, useStyles } from '@grafana/ui';
import React from 'react';
import { Label } from 'types';
import { css } from 'emotion';

interface Props {
  label: Label;
  onLabelSelect: (label: Label) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: #9933cc;
    border-radius: 1px;
  `,
});

export const CheckCardLabel = ({ label, onLabelSelect }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <Tag onClick={() => onLabelSelect(label)} name={`${label.name}: ${label.value}`} className={styles.container} />
  );
};
