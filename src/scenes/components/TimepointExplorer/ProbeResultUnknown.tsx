import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface ProbeResultUnknownProps {
  children: ReactNode;
  image: ReactNode;
  title: string;
}

export const ProbeResultUnknown = ({ children, image, title }: ProbeResultUnknownProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Box padding={2} maxWidth="960px">
        <div className={styles.grid}>
          <div className={styles.image}>{image}</div>
          <Stack direction="column">
            <Text element={`h2`} variant="h4">
              {title}
            </Text>
            {children}
          </Stack>
        </div>
      </Box>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `probeResultUnknown`;

  return {
    container: css({
      containerName,
      containerType: `inline-size`,
    }),
    grid: css({
      display: `grid`,
      gridTemplateColumns: `280px 1fr`,
      gap: theme.spacing(4),

      [`@container ${containerName} (max-width: ${theme.breakpoints.values.sm + 1}px)`]: {
        gridTemplateColumns: `1fr`,
      },
    }),
    image: css({
      width: `280px`,
      height: `315px`,
    }),
  };
};
