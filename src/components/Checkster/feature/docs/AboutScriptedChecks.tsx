import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, TextLink, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { k6StudioLogoDarkTheme, k6StudioLogoLightTheme } from 'img';

export function AboutScriptedChecks() {
  const theme = useTheme2();
  const src = theme.isDark ? k6StudioLogoDarkTheme : k6StudioLogoLightTheme;
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <Text variant="h3">About Scripted Checks</Text>
      <Text element="p">
        Scripted checks are built on top of Grafana k6. Read{' '}
        <TextLink
          href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6-browser/"
          external
        >
          here
        </TextLink>{' '}
        for more information on getting started.
      </Text>
      <Stack gap={2}>
        <img className={styles.logo} src={src} alt="k6 Studio logo" />
        <Text element="p">
          Save time by recording your scripts using k6 Studio.{' '}
          <TextLink href="https://grafana.com/docs/k6-studio/record-your-first-script/" external>
            Record your first script.
          </TextLink>
        </Text>
      </Stack>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: 100px;
  `,
});
