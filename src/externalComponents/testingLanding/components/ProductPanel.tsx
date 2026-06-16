import React, { type ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getPluginLogoUrl } from 'utils/pluginLogoUrl';

import { OpenLink } from './OpenLink';

interface ProductPanelProps {
  testId: string;
  logoPluginId: string;
  logoAlt: string;
  title: string;
  openHref: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  onOpenClick?: () => void;
}

export function ProductPanel({
  testId,
  logoPluginId,
  logoAlt,
  title,
  openHref,
  description,
  actions,
  children,
  onOpenClick,
}: ProductPanelProps) {
  const styles = useStyles2(getStyles);

  return (
    <section className={styles.panel} data-testid={testId}>
      <Stack direction="column" gap={2.5}>
        <Stack direction="column" gap={1}>
          <Stack direction="row" gap={1.5} alignItems="center" wrap="wrap">
            <img src={getPluginLogoUrl(logoPluginId)} alt={logoAlt} className={styles.logo} />
            <Text element="h2" variant="h4" weight="medium">
              {title}
            </Text>
            <OpenLink
              href={openHref}
              onClick={onOpenClick ? () => onOpenClick() : undefined}
            />
          </Stack>
          <Text variant="body" color="secondary">
            {description}
          </Text>
        </Stack>
        {actions && (
          <Stack direction="row" gap={1.5} alignItems="center" wrap="wrap">
            {actions}
          </Stack>
        )}
        {children}
      </Stack>
    </section>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const SIZE = 22;

  return {
    panel: css({
      label: 'testing-synthetics-product-panel',
      padding: theme.spacing(3),
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.secondary,
    }),
    logo: css({
      label: 'testing-synthetics-product-panel-logo',
      width: SIZE,
      height: SIZE,
      objectFit: 'contain',
      display: 'block',
    }),
  };
}
