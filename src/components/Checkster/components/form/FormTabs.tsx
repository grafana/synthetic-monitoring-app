import React, {
  Children,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { FieldPath } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Tab, TabContent, TabsBar, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues } from 'types';

import { FIELD_SPACING } from '../../constants';
import { ErrorIcon } from '../ErrorIcon';

type FormTabContentChild = ReactElement<FormTabContentProps>;
type FormTabChild = undefined | false | FormTabContentChild;

interface FormTabProps {
  children?: FormTabChild | FormTabChild[];
  actions?: ReactNode;
  activeIndex?: number;
  tabErrorIndexes?: boolean[];
}

function TabErrorIndicator() {
  const theme = useTheme2();

  return (
    <ErrorIcon
      className={css`
        display: inline-block;
        margin-left: ${theme.spacing(1)};
      `}
    />
  );
}

function isValidTabChild(child: ReactNode): child is FormTabContentChild {
  return isValidElement(child) && child.type === FormTabContent;
}

export function FormTabs({ children, actions, activeIndex = 0, tabErrorIndexes }: FormTabProps) {
  const [active, setActive] = useState(activeIndex);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    const firstErrorIndex = tabErrorIndexes?.findIndex((item) => item) ?? undefined;
    if (firstErrorIndex !== undefined && firstErrorIndex >= 0) {
      setActive(firstErrorIndex);
    }
    // Only run hook on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TabsBar className={styles.tabsBar}>
        {Children.map(children, (child, index) => {
          if (!isValidTabChild(child)) {
            if (typeof child !== 'boolean' && child !== null) {
              console.warn('FormTabs only accepts FormTabs.Tab as children', typeof child, String(child));
            }

            return null;
          }
          return (
            <Tab
              suffix={tabErrorIndexes && tabErrorIndexes[index] ? TabErrorIndicator : undefined}
              key={index}
              active={active === index}
              label={child.props.label}
              onChangeTab={() => setActive(index)}
            >
              {child}
            </Tab>
          );
        })}
        <div className={styles.tabsBarActions}>
          {Children.map(children, (child, index) => {
            if (!isValidTabChild(child)) {
              return null;
            }

            return active === index ? (child.props.actions ?? null) : null;
          })}
          {actions}
        </div>
      </TabsBar>
      {Children.map(children, (child, index) => {
        if (!isValidTabChild(child)) {
          return null;
        }

        return active === index ? (
          <TabContent
            data-testid={CHECKSTER_TEST_ID.ui.formTabs.content}
            className={cx(
              styles.tabContent,
              !child.props.vanilla && styles.tabContentSpacing,
              child.props.fillVertical && styles.tabContentFillVertical,
              child.props.className
            )}
            key={index}
          >
            {child.props.children}
          </TabContent>
        ) : null;
      })}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    tabsBar: css`
      flex-shrink: 0;
    `,
    tabsBarActions: css`
      display: flex;
      margin-left: auto;
      align-items: center;
      gap: ${theme.spacing(1)};
    `,
    tabContent: css`
      background-color: transparent;
      display: flex;
      flex-direction: column;
    `,
    tabContentSpacing: css`
      gap: ${theme.spacing(FIELD_SPACING)};
      padding: ${theme.spacing(1)};
    `,

    tabContentFillVertical: css`
      flex: 1 1 0;
      overflow: visible;
      & > div {
        flex-grow: 1;
        margin-bottom: unset;
        overflow: unset;
      }
    `,
  };
}

interface FormTabContentProps extends PropsWithChildren {
  label: string;
  containsFields?: FieldPath<CheckFormValues>;
  actions?: ReactNode;
  className?: string;
  fillVertical?: boolean;
  vanilla?: boolean; // Skip content padding and any other "normal" styling, content takes responsibility
}

export function FormTabContent({ children }: FormTabContentProps) {
  return <>{children}</>;
}
