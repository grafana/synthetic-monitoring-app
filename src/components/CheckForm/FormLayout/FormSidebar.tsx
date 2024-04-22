import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export function FormSidebar({
  sections,
  onSectionSelect,
  activeIndex,
}: {
  sections: Array<{ label: string; hasErrors: boolean }>;
  onSectionSelect: (index: number) => void;
  activeIndex: number;
}) {
  const styles = useStyles2(getStyles);
  return (
    <ol className={styles.container}>
      {sections.map(({ label: sectionTitle, hasErrors }, sectionIndex) => (
        <li
          key={sectionTitle}
          onClick={() => onSectionSelect(sectionIndex)}
          className={cx(styles.listItem, { [styles.active]: activeIndex === sectionIndex })}
        >
          <div className={css({ cursor: 'pointer' })}>
            {sectionTitle}
            {hasErrors && <Icon name={`exclamation-triangle`} />}
          </div>
          {sectionIndex !== sections.length - 1 && <div className={styles.divider} />}
        </li>
      ))}
    </ol>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({ marginRight: theme.spacing(9), paddingLeft: theme.spacing(1), 'list-style-type': 'none' }),
    listItem: css({
      fontWeight: theme.typography.fontWeightLight,
      color: theme.colors.text.secondary,
    }),
    active: css({
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.maxContrast,
    }),
    divider: css({
      height: theme.spacing(2),
      borderLeft: `1px dotted ${theme.colors.text.secondary}`,
      margin: `${theme.spacing(1)} 0`,
    }),
  };
}
