import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Label, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
    gap: ${theme.spacing(2)};
  `,
  checkbox: css`
    position: relative;
  `,
  label: css`
    margin-bottom: 0;
  `,
});

interface Props {
  disabled?: boolean;
  id: string;
  name?: string;
  label?: string;
  description?: string;
  className?: string;
  value?: boolean;
  onChange?: () => void;
}

export const HorizontalCheckboxField = ({
  disabled,
  id,
  name,
  label,
  description,
  className,
  value,
  onChange,
}: Props) => {
  const styles = useStyles2(getStyles);
  const { register } = useFormContext();
  const registered = name ? register(name) : {};

  return (
    <div className={cx(styles.container, className)}>
      <Checkbox
        disabled={disabled}
        id={id}
        style={{ marginRight: '10px' }}
        value={value}
        onChange={onChange}
        {...registered}
      />
      <Label description={description} htmlFor={id} className={styles.label}>
        {label}
      </Label>
    </div>
  );
};
