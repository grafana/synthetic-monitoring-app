import React, { ElementType, forwardRef, HTMLAttributes } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { TimepointStatus, TimepointVizOption } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

type TimepointVizItemProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  status: TimepointStatus;
};

export const TimepointVizItem = forwardRef<HTMLElement, TimepointVizItemProps>(
  ({ as: Component = 'div', children, className, status, ...props }, ref) => {
    const vizOption = useTimepointVizOptions(status);
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
    color: ${vizOption.textColor};
  `,
});
