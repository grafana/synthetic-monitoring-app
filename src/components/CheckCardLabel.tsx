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
    /* padding: ${theme.spacing.xs}; */
    background-color: #9933cc;
    border-radius: 1px;
  `,
});

export const CheckCardLabel = ({ label, onLabelSelect }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Tag onClick={() => onLabelSelect(label)} name={`${label.name}: ${label.value}`} className={styles.container} />
    </div>
  );
  // return (
  //   <div
  //     className={styles.container}
  //     onClick={(e) => {
  //       e.stopPropagation();
  //       onLabelSelect(label);
  //     }}
  //   >
  //     {label.name}: {label.value}
  //   </div>
  // );
};
