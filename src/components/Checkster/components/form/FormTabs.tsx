import React, { Children, Fragment, isValidElement, PropsWithChildren, ReactElement, ReactNode, useState } from 'react';
import { FieldPath } from 'react-hook-form';
import { Tab, TabContent, TabsBar, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { FIELD_SPACING } from '../../constants';

type FormTabChild = ReactElement<FormTabContentProps>;

interface FormTabProps {
  children: FormTabChild | FormTabChild[];
  actions?: ReactNode;
}

function isValidTabChild(child: ReactNode): child is FormTabChild {
  return isValidElement(child) && child.type === FormTabContent;
}

export function FormTabs({ children, actions }: FormTabProps) {
  const [active, setActive] = useState(0);
  const theme = useTheme2();

  return (
    <>
      <TabsBar>
        {Children.map(children, (child, index) => {
          if (!isValidTabChild(child)) {
            console.warn('FormTabs only accepts FormTabs.Tab as children');
            return null;
          }
          return (
            <Tab key={index} active={active === index} label={child.props.label} onChangeTab={() => setActive(index)}>
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
      <TabContent
        className={css`
          background-color: transparent;
          padding: ${theme.spacing(1)};
          display: flex;
          flex-direction: column;
          gap: ${theme.spacing(FIELD_SPACING)};
        `}
      >
        {Children.map(children, (child, index) => {
          if (!isValidTabChild(child)) {
            return null;
          }

          return active === index ? <Fragment key={index}>{child.props.children}</Fragment> : null;
        })}
      </TabContent>
    </>
  );
}

interface FormTabContentProps extends PropsWithChildren {
  label: string;
  containsFields?: FieldPath<CheckFormValues>;
  actions?: ReactNode;
}

export function FormTabContent({ children }: FormTabContentProps) {
  return <>{children}</>;
}
