import React, { useCallback, useMemo } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';
import { GrafanaTheme2 } from '@grafana/data';
import { type IconName, useStyles2, VerticalTab } from '@grafana/ui';
import { css } from '@emotion/css';
import { CONFIG_TEST_ID } from 'test/dataTestIds';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useUserPermissions } from 'data/permissions';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
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
  const { canReadAlerts } = useUserPermissions();
  const { isEnabled: isLabelMigrationEnabled } = useFeatureFlag(FeatureName.LabelMigration);
  const { isEnabled: isSecretsManagementEnabled } = useFeatureFlag(FeatureName.SecretsManagement);

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
    if (isLabelMigrationEnabled) {
      items.push({
        icon: 'tag-alt',
        text: 'Label migration',
        url: getConfigTabUrl('label-migration'),
        active: activeTab('label-migration'),
      });
    }

    if (isSecretsManagementEnabled) {
      items.push({
        icon: 'key-skeleton-alt',
        text: 'Secrets',
        url: getConfigTabUrl('secrets'),
        active: activeTab('secrets'),
      });
    }

    if (canReadAlerts) {
      items.push({
        icon: 'bell',
        text: 'Alerts (Legacy)',
        url: getConfigTabUrl('alerts'),
        active: activeTab('alerts'),
      });
    }

    return items;
  }, [activeTab, canReadAlerts, isLabelMigrationEnabled, isSecretsManagementEnabled]);

  return (
    <SyntheticsPluginPage activeTab={SyntheticsTab.Configuration}>
      <div className={styles.layout}>
        <div className={styles.nav} role="tablist" aria-orientation="vertical" aria-label="Configuration">
          {navItems.map((item) => (
            <VerticalTab
              key={item.url}
              label={item.text}
              // VerticalTab otherwise uses its e2e selector as the accessible name.
              aria-label={item.text}
              icon={item.icon}
              href={item.url}
              active={item.active}
              data-testid={item.active ? CONFIG_TEST_ID.layout.activeNavItem : undefined}
            />
          ))}
        </div>
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
  content: css({
    flexGrow: 1,
    minWidth: 0,
  }),
});
