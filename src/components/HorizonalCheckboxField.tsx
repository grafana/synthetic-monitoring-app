import React, { FC } from 'react';
import { css, cx } from 'emotion';
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

export const HorizonalCheckboxField: FC<Props> = ({
  disabled,
  id,
  name,
  label,
  description,
  className,
  value,
  onChange,
}) => {
  const styles = useStyles(getStyles);
  const { register } = useFormContext();

  return (
    <div className={cx(styles.container, className)}>
      <Checkbox
        name={name}
        ref={name ? register : undefined}
        disabled={disabled}
        id={id}
        style={{ position: 'relative' }}
        value={value}
        onChange={onChange}
      />
      <Label description={description} htmlFor={id} className={styles.label}>
        {label}
      </Label>
    </div>
  );
};
