import React, { ComponentProps, forwardRef } from 'react';
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

interface Props extends ComponentProps<typeof Checkbox> {
  disabled?: boolean;
  id: string;
  name?: string;
  label?: string;
  description?: string;
  className?: string;
  value?: boolean;
}

export const HorizontalCheckboxField = forwardRef<HTMLInputElement, Props>(
  ({ id, label, description, className, ...props }, ref) => {
    const styles = useStyles2(getStyles);

    return (
      <div className={cx(styles.container, className)}>
        <Checkbox style={{ marginRight: '10px' }} id={id} ref={ref} {...props} />
        <Label description={description} htmlFor={id} className={styles.label}>
          {label}
        </Label>
      </div>
    );
  }
);

HorizontalCheckboxField.displayName = 'HorizontalCheckboxField';
