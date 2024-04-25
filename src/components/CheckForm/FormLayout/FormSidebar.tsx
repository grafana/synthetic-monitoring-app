import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export interface FormSidebarSection {
  label: string;
  hasErrors: boolean;
  required?: boolean;
  visited: boolean;
}

export function FormSidebar({
  sections,
  onSectionSelect,
  activeIndex,
}: {
  sections: FormSidebarSection[];
  onSectionSelect: (index: number) => void;
  activeIndex: number;
}) {
  const styles = useStyles2(getStyles);
  return (
    <ol className={styles.container} data-testid="form-sidebar">
      {sections.map(({ label: sectionTitle, required, hasErrors, visited }, sectionIndex) => {
        let prefix = <span className={css({ width: '16px', display: 'inline-block' })}>{sectionIndex + 1}</span>;

        if (visited) {
          prefix = <Icon name={`check`} color={config.theme2.colors.success.main} />;
        }

        if (hasErrors) {
          prefix = <Icon name={`exclamation-triangle`} color={config.theme2.colors.error.main} />;
        }

        const isActive = activeIndex === sectionIndex;
        const isLast = sectionIndex === sections.length - 1;

        return (
          <>
            <li key={sectionTitle} className={cx(styles.listItem, { [styles.active]: isActive })}>
              <button
                className={styles.listItemLabel}
                type="button"
                onClick={() => {
                  onSectionSelect(sectionIndex);
                }}
              >
                {prefix}
                <div className={cx(styles.label, { [`activeLabel`]: isActive })}>{`${sectionTitle} ${
                  required ? ' *' : ``
                }`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </>
        );
      })}
    </ol>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const containerName = `checkForm`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${containerName} ${query}`;
  const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;
  const border = `1px solid ${theme.colors.border.medium}`;

  return {
    container: css({
      'list-style-type': 'none',
      borderRight: border,

      [containerQuery]: {
        display: `flex`,
        alignItems: `center`,
        borderRight: 0,
        paddingBottom: theme.spacing(1),
        borderBottom: border,
      },
      [mediaQuery]: {
        display: `flex`,
        alignItems: `center`,
        borderRight: 0,
        paddingBottom: theme.spacing(1),
        borderBottom: border,
      },
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
    activeLabel: css({}),
    label: css({
      [`&:not(.activeLabel)`]: {
        [containerQuery]: {
          display: 'none',
        },
        [mediaQuery]: {
          display: 'none',
        },
      },
    }),
    active: css({
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.maxContrast,
    }),
    divider: css({
      height: theme.spacing(2),
      borderLeft: `2px solid ${theme.colors.border.medium}`,
      margin: theme.spacing(1, 1.5),

      [containerQuery]: {
        margin: theme.spacing(0, 0.5),
      },
      [mediaQuery]: {
        margin: theme.spacing(0, 0.5),
      },
    }),
  };
}
