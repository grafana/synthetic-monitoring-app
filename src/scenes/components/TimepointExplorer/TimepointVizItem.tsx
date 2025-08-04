import React, { ElementType, forwardRef, HTMLAttributes, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';

type TimepointVizItemProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  state: `failure` | `success` | `unknown`;
};

type TimepointVizOption = {
  border: string;
  backgroundColor: string;
  color: string;
};

type TimepointVizOptions = {
  success: TimepointVizOption;
  failure: TimepointVizOption;
  unknown: TimepointVizOption;
};

export const TimepointVizItem = forwardRef<HTMLElement, TimepointVizItemProps>(
  ({ as: Component = 'div', children, className, state, ...props }, ref) => {
    const { vizOptions } = useTimepointExplorerContext();
    const theme = useTheme2();
    const option = vizOptions[state];

    const options: TimepointVizOptions = useMemo(() => {
      return {
        success: {
          border: option,
          backgroundColor: 'transparent',
          color: option,
        },
        failure: {
          border: `transparent`,
          backgroundColor: option,
          color: theme.colors.getContrastText(option),
        },
        unknown: {
          border: option,
          backgroundColor: 'transparent',
          color: theme.colors.getContrastText(option),
        },
      };
    }, [theme, option]);

    const vizOption = options[state];
    const styles = useStyles2((theme) => getStyles(theme, vizOption));

    return (
      <Component className={cx(styles.container, className)} ref={ref} {...props}>
        {children}
      </Component>
    );
  }
);

TimepointVizItem.displayName = 'TimepointVizItem';

const getStyles = (theme: GrafanaTheme2, vizOption: TimepointVizOption) => ({
  container: css`
    background-color: ${vizOption.backgroundColor};
    border: 1px solid ${vizOption.border};
    color: ${vizOption.color};
  `,
});
