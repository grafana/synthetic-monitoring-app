import React, { Fragment } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { ZodType } from 'zod';

import { CheckFormValues, CheckType } from 'types';
import { ANALYTICS_STEP_MAP } from 'components/CheckForm/FormLayout/FormLayout.constants';

import { checkForErrors, useFormLayoutInternal } from './formlayout.utils';

type FormSidebarProps = {
  activeSection: number;
  checkState: 'new' | 'existing';
  checkType: CheckType;
  onSectionClick: (index: number) => void;
  visitedSections: number[];
  schema: ZodType<FieldValues>;
};

export const FormSidebar = ({ checkState, checkType, onSectionClick, visitedSections, schema }: FormSidebarProps) => {
  const styles = useStyles2(getStyles);
  const values = useFormContext<CheckFormValues>().watch();
  const { stepOrder, activeSection } = useFormLayoutInternal();

  return (
    <ol className={styles.container} data-testid="form-sidebar">
      {Object.entries(stepOrder).map(([indexKey, { label, fields = [] }]) => {
        const index = Number(indexKey);
        const hasBeenVisited = visitedSections.includes(index);
        const { errors } = checkForErrors({ fields, values, schema });
        const hasErrors = errors.length > 0;
        const isActive = activeSection === index;
        const isLast = index === Object.entries(stepOrder).length - 1;

        return (
          <Fragment key={label}>
            <li className={styles.listItem}>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  trackNavigateWizardForm({
                    checkState,
                    checkType,
                    component: 'stepper',
                    step: ANALYTICS_STEP_MAP[index],
                  });
                  onSectionClick(index);
                }}
              >
                <Prefix index={index + 1} visited={hasBeenVisited} hasErrors={hasErrors} />
                <div className={cx(styles.label, { [styles.activeLabel]: isActive })}>{`${label}`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </Fragment>
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
  const containerName = `formLayout`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${containerName} ${query}`;
  const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;
  const border = `1px solid ${theme.colors.border.medium}`;

  const activeLabel = css({
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text.maxContrast,
  });

  const label = css({
    [`&:not(.${activeLabel})`]: {
      [containerQuery]: {
        // display: 'none',
      },
      [mediaQuery]: {
        display: 'none',
      },
    },
  });

  return {
    container: css({
      listStyleType: 'none',
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
    button: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      width: '100%',
      border: 'none',
      background: 'none',

      [`&:hover .${label}, &:focus-visible .${label}`]: {
        textDecoration: 'underline',
      },
    }),
    activeLabel,
    label,
    divider: css({
      height: theme.spacing(2),
      borderLeft: `2px solid ${theme.colors.border.medium}`,
      margin: theme.spacing(1, 1.5),

      [containerQuery]: {
        borderBottom: `2px solid ${theme.colors.border.medium}`,
        margin: theme.spacing(0, 0.5),
        width: theme.spacing(2),
        borderLeft: 'unset',
        height: 'unset',
      },
      [mediaQuery]: {
        margin: theme.spacing(0, 0.5),
      },
    }),
  };
}
