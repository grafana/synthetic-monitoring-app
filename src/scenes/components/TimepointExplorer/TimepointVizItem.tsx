import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointVizOption } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

type TimepointVizItemProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  state: `failure` | `success` | `unknown`;
};

export const TimepointVizItem = ({
  as: Component = 'div',
  children,
  className,
  state,
  ...props
}: TimepointVizItemProps) => {
  const { vizOptions } = useTimepointExplorerContext();
  const vizOption = vizOptions[state];
  const styles = useStyles2((theme) => getStyles(theme, vizOption));

  return (
    <Component className={cx(styles.container, className)} {...props}>
      {children}
    </Component>
  );
};

const getStyles = (theme: GrafanaTheme2, vizOption: TimepointVizOption) => ({
  container: css`
    background-color: ${vizOption.backgroundColor};
    border: 1px solid ${vizOption.border};
    color: ${vizOption.color};
  `,
});
