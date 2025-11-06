import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { k6StudioLogoDarkTheme, k6StudioLogoLightTheme } from 'img';

export function Aboutk6Stuido() {
  const theme = useTheme2();
  const src = theme.isDark ? k6StudioLogoDarkTheme : k6StudioLogoLightTheme;
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <Text variant="h4" element="h3">
        <Stack direction="row" alignItems="center" gap={1}>
          <img className={styles.logo} src={src} alt="k6 Studio logo" />
          Get started with k6 Studio
        </Stack>
      </Text>
      <Text element="p">
        k6 Studio is a free, open source desktop application designed to help you create k6 test scripts using a visual
        interface. Download it for free and get started with your first script in minutes.
      </Text>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: 2em;
  `,
});
