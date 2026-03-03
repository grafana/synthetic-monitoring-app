import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { usePluginComponents, usePluginLinks } from '@grafana/runtime';
import { Alert, Box, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { EXTENSION_POINTS } from './SummaryDashboard.constants';

export const HomepageExtensionLinks = () => {
  const styles = useStyles2(getStyles);
  const { links } = usePluginLinks({ extensionPointId: EXTENSION_POINTS.HOME_CTA });
  const { components } = usePluginComponents({ extensionPointId: EXTENSION_POINTS.HOME_CTA });

  const hasLinks = links.length > 0;
  const hasComponents = components.length > 0;

  if (!hasLinks && !hasComponents) {
    return null;
  }

  return (
    <Box marginBottom={2}>
      {links.map((link) => (
        <Alert key={link.id} severity="info" title={link.description ?? ''} className={styles.alert}>
          <TextLink href={link.path} external={link.openInNewTab} inline>
            {link.title}
          </TextLink>
        </Alert>
      ))}
      {components.map((Component, index) => (
        <Component key={Component.meta?.pluginId ?? index} />
      ))}
    </Box>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  alert: css({
    marginBottom: theme.spacing(0),
  }),
});
