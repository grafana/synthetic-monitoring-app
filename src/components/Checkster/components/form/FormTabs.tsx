import React, {
  Children,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Tab, TabContent, TabsBar, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

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
  const {
    formState: { submitCount },
  } = useFormContext<CheckFormValues>();

  const [active, setActive] = useState(activeIndex);

  useEffect(() => {
    // If form is submitted, resync activeIndex prop, to show validation errors
    const firstErrorIndex = tabErrorIndexes?.findIndex((item) => item) ?? undefined;
    if (firstErrorIndex !== undefined && firstErrorIndex >= 0) {
      setActive(firstErrorIndex);
    }
  }, [tabErrorIndexes, submitCount]);

  const theme = useTheme2();

  return (
    <>
      <TabsBar
        className={css`
          flex-shrink: 0;
        `}
      >
        {Children.map(children, (child, index) => {
          if (!isValidTabChild(child)) {
            console.warn('FormTabs only accepts FormTabs.Tab as children');
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
        <div
          className={css`
            display: flex;
            margin-left: auto;
            align-items: center;
            gap: ${theme.spacing(1)};
          `}
        >
          {Children.map(children, (child, index) => {
            if (!isValidTabChild(child)) {
              return null;
            }

            return active === index ? child.props.actions ?? null : null;
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
            className={cx(
              css`
                background-color: transparent;
                display: flex;
                flex-direction: column;
              `,
              !child.props.vanilla &&
                css`
                  gap: ${theme.spacing(FIELD_SPACING)};
                  padding: ${theme.spacing(1)};
                `,
              child.props.fillVertical &&
                css`
                  flex: 1 1 0;
                  overflow: auto;
                  & > div {
                    flex-grow: 1;
                    margin-bottom: unset;
                    overflow: unset;
                  }
                `,
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
