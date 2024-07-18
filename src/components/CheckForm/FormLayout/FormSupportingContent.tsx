import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

export const FormSupportingContent = () => {
  const styles = useStyles2(getStyles);
  const { supportingContent } = useCheckFormContext();
  const { requests } = supportingContent;
  const demo = requests[requests.length - 1];

  return (
    <>
      <div className={styles.container}>
        <Text element={`h3`}>Requests</Text>
        {demo && (
          <div key={demo.id}>
            <Text>{demo.check.state}</Text>
            {demo.data.result ? (
              <pre>
                <code>{JSON.stringify(demo.data.result, null, 2)}</code>
              </pre>
            ) : (
              <Spinner />
            )}
          </div>
        )}
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    borderLeft: `1px solid ${theme.colors.border.medium}`,
    paddingLeft: theme.spacing(2),
    maxHeight: `80vh`,
    overflow: `auto`,
  }),
});
