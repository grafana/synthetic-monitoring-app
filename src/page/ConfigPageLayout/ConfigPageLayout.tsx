import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, type IconName, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CONFIG_TEST_ID } from 'test/dataTestIds';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useFeatureFlagContext } from 'hooks/useFeatureFlagContext';
import { SyntheticsTab } from 'page/SyntheticsPageNav';
import { SyntheticsPluginPage } from 'page/SyntheticsPluginPage';

interface ConfigNavItem {
  icon: IconName;
  text: string;
  url: string;
  active: boolean;
}

function getConfigTabUrl(tab = '/') {
  return `${getRoute(AppRoutes.Config)}/${tab}`.replace(/\/+/g, '/');
}

function useActiveTab(route: AppRoutes) {
  const fullRoute = getRoute(route);
  const location = useLocation();

  return useCallback(
    (path?: string) => {
      const url = `${fullRoute}/${path ?? ''}`.replace(/\/+/g, '/');
      return Boolean(matchPath(url ?? '', location.pathname));
    },
    [fullRoute, location.pathname]
  );
}

export function ConfigPageLayout() {
  const styles = useStyles2(getStyles);
  const activeTab = useActiveTab(AppRoutes.Config);
  const { isFeatureEnabled } = useFeatureFlagContext();

  const navItems = useMemo(() => {
    const items: ConfigNavItem[] = [
      {
        icon: 'cog',
        text: 'General',
        url: getConfigTabUrl(),
        active: activeTab(''),
      },
      {
        icon: 'key-skeleton-alt',
        text: 'Access tokens',
        url: getConfigTabUrl('access-tokens'),
        active: activeTab('access-tokens'),
      },
      {
        icon: 'brackets-curly',
        text: 'Terraform',
        url: getConfigTabUrl('terraform'),
        active: activeTab('terraform'),
      },
    ];

    // Label Migration is feature-flagged for rollout. The tab itself limits
    // mode changes to admins and shows a contact-admin notice otherwise.
    if (isFeatureEnabled(FeatureName.LabelMigration)) {
      items.push({
        icon: 'tag-alt',
        text: 'Label migration',
        url: getConfigTabUrl('label-migration'),
        active: activeTab('label-migration'),
      });
    }

    if (isFeatureEnabled(FeatureName.SecretsManagement)) {
      items.push({
        icon: 'key-skeleton-alt',
        text: 'Secrets',
        url: getConfigTabUrl('secrets'),
        active: activeTab('secrets'),
      });
    }

    items.push({
      icon: 'bell',
      text: 'Alerts (Legacy)',
      url: getConfigTabUrl('alerts'),
      active: activeTab('alerts'),
    });

    return items;
  }, [activeTab, isFeatureEnabled]);

  return (
    <SyntheticsPluginPage activeTab={SyntheticsTab.Configuration}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Configuration">
          {navItems.map((item) => (
            <a
              key={item.url}
              href={item.url}
              className={cx(styles.item, item.active && styles.active)}
              aria-current={item.active ? 'page' : undefined}
              data-testid={item.active ? CONFIG_TEST_ID.layout.activeNavItem : undefined}
            >
              <Icon name={item.icon} />
              {item.text}
            </a>
          ))}
        </nav>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </SyntheticsPluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  layout: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
  }),
  nav: css({
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: theme.spacing(28),
    paddingRight: theme.spacing(2),
    borderRight: `1px solid ${theme.colors.border.weak}`,
  }),
  item: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    color: theme.colors.text.primary,
    textDecoration: 'none',

    '&:hover, &:focus': {
      textDecoration: 'underline',
    },
  }),
  active: css({
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
    background: theme.colors.action.selected,

    '&::before': {
      display: 'block',
      content: '" "',
      position: 'absolute',
      left: 0,
      width: 4,
      top: 2,
      bottom: 2,
      borderRadius: theme.shape.radius.default,
      backgroundImage: theme.colors.gradients.brandVertical,
    },
  }),
  content: css({
    flexGrow: 1,
    minWidth: 0,
  }),
});
