import React, { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFormValues } from 'types';

import { FORM_SECTION_ORDER } from '../CheckForm/constants';
import { checkForErrors } from './CheckEditor.utils';
import { useCheckEditorContext } from './CheckEditorContext';
import { FORM_CONTAINER_NAME } from './FormRoot.constants';

export function CheckEditorSectionNavigation() {
  const styles = useStyles2(getStyles);

  const values = useFormContext<CheckFormValues>().watch();
  const {
    stepOrder,
    activeSection,
    goToSection,
    visitedSections,
    checkMeta: { schema, checkState, checkType },
  } = useCheckEditorContext();

  return (
    <ol className={styles.container} data-testid={DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION}>
      {Object.entries(stepOrder).map(([indexKey, { label, fields = [] }]) => {
        const index = Number(indexKey);
        const hasBeenVisited = visitedSections.includes(index);
        const { errors } = checkForErrors({ fields, values, schema });
        const hasErrors = errors.length > 0;
        const isActive = activeSection === index;
        const isLast = index === Object.entries(stepOrder).length - 1;

        return (
          <Fragment key={label}>
            <li
              className={cx(
                'CheckEditorSectionNav-item',
                styles.listItem,
                isActive && 'CheckEditorSectionNav-item--active'
              )}
            >
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
                  goToSection(index);
                }}
              >
                <Prefix index={index + 1} visited={hasBeenVisited} hasErrors={hasErrors} />
                <div
                  className={cx(
                    'CheckEditorSectionNav-item-label',
                    styles.label,
                    isActive && 'CheckEditorSectionNav-item-label--active'
                  )}
                >{`${label}`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </Fragment>
        );
      })}
    </ol>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${FORM_CONTAINER_NAME} ${query}`;

  const isActive = css``;
  const label = css`
    .CheckEditorSectionNav-item--active & {
      color: ${theme.colors.text.maxContrast};
    }

    &:not(.CheckEditorSectionNav-item--active &) {
      ${containerQuery} {
        display: none;
      }
    }
  `;

  return {
    isActive,
    container: css`
      list-style-type: none;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    listItem: css`
      font-weight: ${theme.typography.fontWeightLight};
      color: ${theme.colors.text.secondary};
    `,
    button: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      width: 100%;
      border: none;
      background: none;

      &:hover .CheckEditorSectionNav-item-label,
      &:focus-visible .CheckEditorSectionNav-item-label {
        text-decoration: underline;
      }
    `,
    label,
    divider: css`
      border-bottom: 2px solid ${theme.colors.border.medium};
      margin: ${theme.spacing(0, 0.5)};
      width: ${theme.spacing(2)};
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
    <div className={cx(styles.container, visited && 'CheckEditorSectionNav-item-prefix--visited')}>
      {visited && <Icon name={name} color={color} />}
      {!visited && <span className={css({ width: '16px', display: 'inline-block' })}>{index}</span>}
    </div>
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

      .CheckEditorSectionNav-item--active &,
      &.CheckEditorSectionNav-item-prefix--visited {
        background-color: ${theme.colors.background.secondary};
      }
      .CheckEditorSectionNav-item--active & {
        color: ${theme.colors.text.maxContrast};
        border: 1px solid ${theme.colors.border.strong};
      }
    `,
  };
}
