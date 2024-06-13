import React, { Children, Fragment, isValidElement, ReactNode, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Indent } from 'components/Indent';

export const RequestOptions = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)} type="button" fill="text" icon={open ? `arrow-down` : `arrow-right`}>
        Request options
      </Button>
      {open && (
        <Indent>
          <RequestOptionsContent>{children}</RequestOptionsContent>
        </Indent>
      )}
    </div>
  );
};

const RequestOptionsContent = ({ children }: { children: ReactNode }) => {
  const styles = useStyles2(getStyles);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.stackCol}>
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
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    gap: theme.spacing(1),
  }),
});
