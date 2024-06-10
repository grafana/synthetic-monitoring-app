import React, { Children, Fragment, isValidElement, ReactNode } from 'react';
import { Tab, TabContent, TabsBar } from '@grafana/ui';

type RequestOptionsProps = {
  children: ReactNode;
};

export const RequestOptions = ({ children }: RequestOptionsProps) => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <>
      <TabsBar>
        {Children.map(children, (section, i) => {
          if (!isValidElement(section)) {
            return null;
          }

          return (
            <Tab
              key={section.props.label}
              label={section.props.label}
              onChangeTab={() => setActiveTab(i)}
              active={activeTab === i}
            />
          );
        })}
      </TabsBar>
      <TabContent>
        {Children.map(children, (section, i) => {
          if (!isValidElement(section)) {
            return null;
          }

          return activeTab === i && <Fragment key={section.props.label}>{section}</Fragment>;
        })}
      </TabContent>
    </>
  );
};

const RequestOptionSection = ({ children }: any) => {
  return children;
};

RequestOptions.Section = RequestOptionSection;
