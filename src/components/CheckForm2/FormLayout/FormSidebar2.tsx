import React, { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormValues } from 'types';

import { useCheckFormSchema } from '../checkForm.hooks';
import { checkForErrors } from './formlayout.utils';
import { useFormLayoutContext } from './formLayoutContextProvider';
import { FormSectionProps } from './FormSection';

type FormSidebarProps = {
  sections: Array<ReactElement<FormSectionProps>>;
};

export const FormSidebar2 = ({ sections }: FormSidebarProps) => {
  const styles = useStyles2(getStyles);
  const { activeSection, goToSection, visitedSections } = useFormLayoutContext();
  const values = useFormContext<CheckFormValues>().watch();
  const schema = useCheckFormSchema();

  return (
    <ol className={styles.container} data-testid="form-sidebar">
      {sections.map(({ props }) => {
        const sectionIndex = props.index;
        const label = props.label;
        const hasBeenVisited = visitedSections.includes(sectionIndex);
        const fields = props.fields || [];
        const { errors } = checkForErrors({ fields, values, schema });
        const hasErrors = errors.length > 0;

        const isActive = activeSection === sectionIndex;
        const isLast = sectionIndex === sections.length - 1;

        return (
          <>
            <li key={label} className={cx(styles.listItem, { [styles.active]: isActive })}>
              <button
                className={styles.listItemLabel}
                type="button"
                onClick={() => {
                  goToSection(sectionIndex);
                }}
              >
                <Prefix index={sectionIndex + 1} visited={hasBeenVisited} hasErrors={hasErrors} />
                <div className={cx(styles.label, { [`activeLabel`]: isActive })}>{`${label}`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </>
        );
      })}
    </ol>
  );
};

const Prefix = ({ index, hasErrors, visited }: any) => {
  if (visited) {
    const name = hasErrors ? `exclamation-triangle` : `check`;
    const color = hasErrors ? config.theme2.colors.error.main : config.theme2.colors.success.main;

    return <Icon name={name} color={color} />;
  }

  return <span className={css({ width: '16px', display: 'inline-block' })}>{index}</span>;
};

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
