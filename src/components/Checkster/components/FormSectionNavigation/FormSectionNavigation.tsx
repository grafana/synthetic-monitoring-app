import React, { Fragment } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CSS_PRIMARY_CONTAINER_NAME } from '../../constants';
import { useChecksterContext } from '../../contexts/ChecksterContext';
import { useLiveErrors } from '../../hooks/useLiveErrors';
import { getHasSectionError } from '../../utils/navigation';

export function FormSectionNavigation() {
  const {
    isNew,
    checkType,
    formNavigation: { sectionOrder, setSectionActive, isSectionActive, getSectionFields, isSeenStep, getSectionLabel },
  } = useChecksterContext();
  const styles = useStyles2(getStyles);
  const allErrors = useLiveErrors();

  return (
    <ol
      data-testid={CHECKSTER_TEST_ID.navigation.root}
      aria-label="Check form navigation"
      role="tablist"
      className={styles.container}
    >
      {sectionOrder.map((sectionName, index) => {
        const sectionFields = getSectionFields(sectionName);
        // Only show errors in nav for seen (or skipped) steps
        const hasErrors = isSeenStep(sectionName) && getHasSectionError(sectionFields, allErrors);
        const hasBeenVisited = isSeenStep(sectionName);
        const isLast = index === sectionOrder.length - 1;
        const label = getSectionLabel(sectionName);

        const isActive = isSectionActive(sectionName);
        return (
          <Fragment key={sectionName}>
            <li className={cx(styles.listItem, { ['label__active']: isActive, isActive: isActive })}>
              <button
                aria-selected={isActive}
                className={styles.button}
                data-testid={CHECKSTER_TEST_ID.navigation[sectionName]}
                id={`form-section-${sectionName}`}
                role="tab"
                type="button"
                onClick={() => {
                  trackNavigateWizardForm({
                    checkState: isNew ? 'new' : 'existing',
                    checkType,
                    component: 'stepper',
                    step: sectionName === 'check' ? 'job' : sectionName,
                  });
                  setSectionActive(sectionName);
                }}
              >
                <Prefix index={index + 1} visited={hasBeenVisited} hasErrors={hasErrors} />
                <div className={styles.label}>{`${label}`}</div>
              </button>
            </li>
            {!isLast && <div className={styles.divider} />}
          </Fragment>
        );
      })}
    </ol>
  );
}

// TODO: Fix `any`
function Prefix({ index, hasErrors, visited }: any) {
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
}

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

function getStyles(theme: GrafanaTheme2) {
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${CSS_PRIMARY_CONTAINER_NAME} ${query}`;

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
