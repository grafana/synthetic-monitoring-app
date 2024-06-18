import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Drawer, IconButton, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useCheckFormContext } from '../CheckFormContext';

export const FormSupportingContent = () => {
  const styles = useStyles2(getStyles);
  const [open, setOpen] = useState(false);
  const { supportingContent } = useCheckFormContext();
  console.log(supportingContent);

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return (
    <>
      <div className={styles.container}>
        {/* <IconButton name={'arrow-left'} onClick={toggle} tooltip={`Open supporting content`} /> */}
        <Content results={[]} />
      </div>

      {open && (
        <Drawer
          onClose={() => {
            setOpen(false);
          }}
          size={`sm`}
        >
          <Content results={[]} />
        </Drawer>
      )}
    </>
  );
};

const Content = ({ results }: { results: string[] }) => {
  return (
    <div>
      <Text element={`h3`}>Requests</Text>
      {results.map((val) => val)}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    borderLeft: `1px solid ${theme.colors.border.medium}`,
    paddingLeft: theme.spacing(2),
  }),
});
