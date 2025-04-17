import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AppRoutes } from 'routing/types';
import { AppInitializer } from 'components/AppInitializer';
import { Card } from 'components/Card';

interface Props {
  children: React.ReactNode;
  redirectTo?: AppRoutes;
  buttonText?: string;
}

export const SubsectionWelcomePage = ({ children, redirectTo, buttonText }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage>
      <Stack alignItems={'center'} justifyContent={'center'}>
        <Card className={styles.welcomeCard}>
          <Stack justifyContent={'center'} alignItems={'center'} direction={'column'} gap={3}>
            <Text element={`h2`}>Get started monitoring your services</Text>
            <div>{children}</div>
            {buttonText && <AppInitializer redirectTo={redirectTo} buttonText={buttonText} />}
          </Stack>
        </Card>
      </Stack>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  welcomeCard: css({
    'max-width': '1200px',
    padding: theme.spacing(4),
    'margin-top': theme.spacing(4),
  }),
});
