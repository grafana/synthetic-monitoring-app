import React, { Children, Fragment, PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

function highlightCode(children: ReactNode, highlight?: string): ReactNode {
  if (!highlight) {
    return children;
  }
  const elements = Children.toArray(children);
  return elements.map((child) => {
    if (typeof child === 'string') {
      return child
        .split(highlight)
        .flatMap((item, index) => [item, <strong key={`${highlight}.${index}`}>{highlight}</strong>])
        .slice(0, -1);
    }
    return child;
  });
}

function doHighlights(children: ReactNode, highlights?: string | string[]): ReactNode {
  const highlightsArray = Array.isArray(highlights) ? highlights : [highlights];

  return highlights
    ? highlightsArray.reduce((acc, currentValue, currentIndex) => {
        return highlightCode(acc, currentValue);
      }, children)
    : children;
}

// Instead if using `<pre />`
export function Preformatted({
  children,
  className,
  highlight,
  isCode = false,
}: PropsWithChildren<{ className?: string; highlight?: string | string[]; isCode?: boolean }>) {
  const styles = useStyles2(getStyles);
  const Wrapper = isCode ? 'code' : Fragment;

  return (
    <pre data-testid={DataTestIds.PREFORMATTED} className={cx(styles.container, className)}>
      <Wrapper>{doHighlights(children, highlight)}</Wrapper>
    </pre>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      overflowY: 'auto',
      maxHeight: '100%',
      whiteSpace: 'pre-wrap',
      backgroundColor: theme.colors.background.canvas,
      marginBottom: theme.spacing(2),
      '& strong': {
        color: theme.colors.warning.text,
      },
      '& code': {
        padding: 0,
        margin: 0,
      },
    }),
  };
}
