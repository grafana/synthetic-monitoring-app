import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { Card } from 'components/Card';
import { Trans } from 'components/i18n';
import { PluginPage } from 'components/PluginPage';

import { AppInitializer } from './AppInitializer';

interface Props {
  children: React.ReactNode;
  redirectTo: ROUTES;
  buttonText: string;
}

export const SubsectionWelcomePage = ({ children, redirectTo, buttonText }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage>
      <Stack alignItems={'center'} justifyContent={'center'}>
        <Card className={styles.welcomeCard}>
          <Stack justifyContent={'center'} alignItems={'center'} direction={'column'} gap={3}>
            <Text element={`h2`}>
              <Trans i18nKey="welcome.checks.title">Get started monitoring your services</Trans>
            </Text>
            <div>{children}</div>
            <AppInitializer redirectTo={redirectTo} buttonText={buttonText} />
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
