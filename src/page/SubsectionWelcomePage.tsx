import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { hasRole } from 'utils';
import { Card } from 'components/Card';
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
          <Stack justifyContent={'center'} alignItems={'center'} direction={'column'}>
            <h2>Get started monitoring your services</h2>
            <p>{children}</p>

            <AppInitializer redirectTo={redirectTo} disabled={!hasRole(OrgRole.Editor)} buttonText={buttonText} />
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
