import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export function FormSidebar({
  sections,
  onSectionSelect,
  activeIndex,
}: {
  sections: Array<{ label: string; hasErrors: boolean; required?: boolean; complete: boolean }>;
  onSectionSelect: (index: number) => void;
  activeIndex: number;
}) {
  const styles = useStyles2(getStyles);
  return (
    <ol className={styles.container}>
      {sections.map(({ label: sectionTitle, required, hasErrors, complete }, sectionIndex) => {
        let prefix = <span className={css({ width: '16px', display: 'inline-block' })}>{sectionIndex + 1}</span>;
        if (required && complete) {
          prefix = <Icon name={`check`} color={config.theme2.colors.success.main} />;
        }
        if (hasErrors) {
          prefix = <Icon name={`exclamation-triangle`} color={config.theme2.colors.error.main} />;
        }
        return (
          <li key={sectionTitle} className={cx(styles.listItem, { [styles.active]: activeIndex === sectionIndex })}>
            <button className={styles.listItemLabel} type="button" onClick={() => onSectionSelect(sectionIndex)}>
              {prefix}
              {sectionTitle}
              {required && ' *'}
            </button>
            {sectionIndex !== sections.length - 1 && <div className={styles.divider} />}
          </li>
        );
      })}
    </ol>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      paddingRight: theme.spacing(9),
      paddingLeft: theme.spacing(1),
      marginRight: theme.spacing(2),
      'list-style-type': 'none',
      borderRight: `1px solid ${theme.colors.border.medium}`,
    }),
    listItem: css({
      fontWeight: theme.typography.fontWeightLight,
      color: theme.colors.text.secondary,
    }),
    listItemLabel: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      width: '100%',
      border: 'none',
      background: 'none',
    }),
    active: css({
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.maxContrast,
    }),
    divider: css({
      height: theme.spacing(2),
      borderLeft: `1px solid ${theme.colors.border.medium}`,
      margin: `${theme.spacing(1)} 0`,
    }),
  };
}
