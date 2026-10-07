import React, { ComponentProps, JSX, ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

type LabelProps = Pick<ComponentProps<typeof Field>, 'label' | 'description' | 'required'> & { 'aria-label'?: string };

function DivLabel({ label, description, required }: LabelProps) {
  const theme = useTheme2();
  return (
    <div>
      {label && (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            margin-bottom: ${theme.spacing(0.5)};
          `}
        >
          <div
            className={css`
              line-height: 1.25;
              font-size: ${theme.typography.bodySmall.fontSize};
              font-weight: ${theme.typography.fontWeightBold};
            `}
          >
            {label}
            {required ? ' *' : ''}
          </div>
        </div>
      )}
      {description && (
        <div
          className={css`
            font-size: ${theme.typography.bodySmall.fontSize};
            color: ${theme.colors.text.secondary};
          `}
        >
          {description}
        </div>
      )}
    </div>
  );
}

export function StyledField({
  className,
  grow,
  emulate, // When there is no valid `id` to use with `htmlFor`, use `emulate` to keep the look, without a11y issues
  label: labelProp,
  description,
  required,
  ...props
}: ComponentProps<typeof Field> & { emulate?: true; grow?: boolean }): JSX.Element {
  const styles = useStyles2(getStyles);
  const label = useMemo((): ReactNode => {
    return emulate ? <DivLabel label={labelProp} description={description} required={required} /> : labelProp;
  }, [description, emulate, labelProp, required]);

  // Would have been sweet to use `Text`, but it doesn't play nice when it comes to line-height
  if (emulate) {
  }

  return (
    <Field
      label={label}
      description={description}
      required={required}
      className={cx(styles.field, className, {
        [styles.grow]: grow,
      })}
      {...props}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    field: css`
      margin: 0;
      & > div:first-child {
        max-width: unset; // is 480 by default
      }
    `,
    grow: css`
      flex-grow: 1;
    `,
  };
};
