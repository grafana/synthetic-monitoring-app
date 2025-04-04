import React, { Children, forwardRef, Fragment, isValidElement, ReactElement, ReactNode, useImperativeHandle, useState } from 'react';
import { Button, Stack, Tab, TabContent, TabProps,TabsBar } from '@grafana/ui';

import { HandleErrorRef } from 'hooks/useNestedRequestErrors';
import { Indent } from 'components/Indent';

interface RequestOptionsProps {
  children: ReactNode;
  open?: boolean;
}

export const RequestOptions = forwardRef<HandleErrorRef, RequestOptionsProps>(({ children, open }, handleErrorRef) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useImperativeHandle(handleErrorRef, () => ({
    openOptions: () => setIsOpen(true),
    goToTab: (index: number) => setActiveTab(index),
  }));

  return (
    <div>
      <Button
        aria-expanded={isOpen}
        fill="text"
        icon={isOpen ? `arrow-down` : `arrow-right`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        Request options
      </Button>
      {isOpen && (
        <Indent>
          <Stack direction={`column`}>
            <TabsBar>
              {Children.map(children, (section, i) => {
                if (!isValidElement(section)) {
                  return null;
                }

                return (
                  <Tab
                    key={(section as ReactElement<TabProps>).props.label}
                    label={(section as ReactElement<TabProps>).props.label}
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

                return activeTab === i && <Fragment key={(section as ReactElement<TabProps>).props.label}>{section}</Fragment>;
              })}
            </TabContent>
          </Stack>{' '}
        </Indent>
      )}
    </div>
  );
});

RequestOptions.displayName = 'RequestOptions';
