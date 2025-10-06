import React, { ComponentProps, JSX } from 'react';
import { Field, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export function StyledField({
  className,
  grow,
  emulate, // When there is no valid `id` to use with `htmlFor`, use `emulate` to keep the look, without a11y issues
  ...props
}: ComponentProps<typeof Field> & { emulate?: true; grow?: boolean }): JSX.Element {
  const theme = useTheme2();

  // Would have been sweet to use `Text`, but it doesn't play nice when it comes to line-height
  if (emulate) {
    return (
      <div
        className={cx(
          css`
            margin: 0;
          `,
          grow &&
            css`
              flex-grow: 1;
            `,
          className
        )}
      >
        {props.label && (
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
              {props.label}
            </div>
          </div>
        )}
        {props.description && (
          <div
            className={css`
              font-size: ${theme.typography.bodySmall.fontSize};
              color: ${theme.colors.text.secondary};
            `}
          >
            {props.description}
          </div>
        )}
        <div>{props.children}</div>
      </div>
    );
  }

  return (
    <Field
      className={cx(
        css`
          margin: 0;
          & > div:first-child {
            max-width: unset; // is 480 by default
          }
        `,
        grow &&
          css`
            flex-grow: 1;
          `,
        className
      )}
      {...props}
    />
  );
}
