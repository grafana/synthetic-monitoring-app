import React from 'react';
import { css, cx } from '@emotion/css';
import { useStyles, Checkbox, Label } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { useFormContext } from 'react-hook-form';

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing.md};
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
  const styles = useStyles(getStyles);
  const { register } = useFormContext();
  const registered = name ? register(name) : {};

  return (
    <div className={cx(styles.container, className)}>
      <Checkbox
        disabled={disabled}
        id={id}
        style={{ position: 'relative' }}
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
