import React, { Fragment, useEffect } from 'react';
import { Tab, TabContent, TabsBar } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { Section } from 'components/CheckForm/FormLayouts/Layout.types';

type SubSectionContentProps<T extends CheckFormValues = CheckFormValues> = {
  sections: Array<Section<T>>;
};
export const SubSectionContent = <T extends CheckFormValues>({ sections }: SubSectionContentProps<T>) => {
  const [activeTab, setActiveTab] = React.useState(0);

  useEffect(() => {
    return () => {
      setActiveTab(0);
    };
  }, [sections]);

  if (sections.length === 1) {
    const Component = sections[0].Component;
    return Component;
  }

  return (
    <>
      <TabsBar>
        {sections.map((section, i) => (
          <Tab key={section.label} label={section.label} onChangeTab={() => setActiveTab(i)} active={activeTab === i} />
        ))}
      </TabsBar>
      <TabContent>
        {sections.map((section, i) => {
          return activeTab === i && <Fragment key={section.label}>{section.Component}</Fragment>;
        })}
      </TabContent>
    </>
  );
};
