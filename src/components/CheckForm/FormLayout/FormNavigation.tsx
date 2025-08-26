import React, { Fragment } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { ZodType } from 'zod';

import { CheckFormValues, CheckType } from 'types';

import { DataTestIds } from '../../../test/dataTestIds';
import { FORM_SECTION_ORDER } from '../constants';
import { checkForErrors, useFormLayoutInternal } from './formlayout.utils';

type FormNavigationProps = {
  activeSection: number;
  checkState: 'new' | 'existing';
  checkType: CheckType;
  onSectionClick: (index: number) => void;
  visitedSections: number[];
  schema: ZodType<FieldValues>;
};

export const FormNavigation = ({
  checkState,
  checkType,
  onSectionClick,
  visitedSections,
  schema,
}: FormNavigationProps) => {
  const styles = useStyles2(getStyles);
  const values = useFormContext<CheckFormValues>().watch();
  const { stepOrder, activeSection } = useFormLayoutInternal();

  return (
    <ol className={styles.container} data-testid={DataTestIds.FORM_SIDEBAR}>
      {Object.entries(stepOrder).map(([indexKey, { label, fields = [] }]) => {
        const index = Number(indexKey);
        const hasBeenVisited = visitedSections.includes(index);
        const { errors } = checkForErrors({ fields, values, schema });
        const hasErrors = errors.length > 0;
        const isActive = activeSection === index;
        const isLast = index === Object.entries(stepOrder).length - 1;

        return (
          <Fragment key={label}>
            <li className={cx(styles.listItem, { ['label__active']: isActive, isActive: isActive })}>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  trackNavigateWizardForm({
                    checkState,
                    checkType,
                    component: 'stepper',
                    step: FORM_SECTION_ORDER[index],
                  });
                  onSectionClick(index);
                }}
              >
                <Prefix index={index + 1} visited={hasBeenVisited} hasErrors={hasErrors} />
                <div className={cx(styles.label, { [styles.isActive]: isActive })}>{`${label}`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </Fragment>
        );
      })}
    </ol>
  );
};

function getPrefixStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      border-radius: 50%;
      width: 2em;
      height: 2em;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${theme.colors.border.medium};

      .label__active &,
      &.prefix__visited {
        background-color: ${theme.colors.background.secondary};
      }
      .label__active & {
        color: ${theme.colors.text.maxContrast};
        border: 1px solid ${theme.colors.border.strong};
      }
    `,
  };
}

const Prefix = ({ index, hasErrors, visited }: any) => {
  const styles = useStyles2(getPrefixStyles);
  let name: IconName = 'check';
  let color = config.theme2.colors.success.main;

  if (visited) {
    name = hasErrors ? `times` : `check`;
    color = hasErrors ? config.theme2.colors.error.main : config.theme2.colors.success.main;
  }

  return (
    <div className={cx(styles.container, visited && 'prefix__visited')}>
      {visited && <Icon name={name} color={color} />}
      {!visited && <span className={css({ width: '16px', display: 'inline-block' })}>{index}</span>}
    </div>
  );
};

function getStyles(theme: GrafanaTheme2) {
  const containerName = `formLayout`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${containerName} ${query}`;

  const isActive = css``;

  const label = css`
    .label__active & {
      //font-weight: ${theme.typography.fontWeightBold}; // causes layout shift
      color: ${theme.colors.text.maxContrast};
    }

    &:not(.label__active &) {
      ${containerQuery} {
        display: none;
      }
    }
  `;

  return {
    isActive,
    container: css({
      listStyleType: 'none',
      display: `flex`,
      alignItems: `center`,
      justifyContent: 'center',
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
    label,
    divider: css({
      borderBottom: `2px solid ${theme.colors.border.medium}`,
      margin: theme.spacing(0, 0.5),
      width: theme.spacing(2),
    }),
  };
}
