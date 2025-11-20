import React from 'react';
import { type InstanceMatchResult, type Route } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { encodeReceiverForUrl, getPolicyIdentifier } from './alertRoutingUtils';

interface RouteTreeDisplayProps {
  routeMatch: InstanceMatchResult;
}

export const RouteTreeDisplay: React.FC<RouteTreeDisplayProps> = ({ routeMatch }) => {
  const styles = useStyles2(getStyles);

  if (!routeMatch.matchedRoutes || routeMatch.matchedRoutes.length === 0) {
    return <Text variant="body">No routing information available.</Text>;
  }
  const processAllMatchedRoutes = () => {
    const routesToRender: Array<{
      route: Route;
      level: number;
      isEffective: boolean;
    }> = [];

    const processedRouteIds = new Set<string>();

    routeMatch.matchedRoutes.forEach((matchedRoute) => {
      const matchingJourney = matchedRoute.matchDetails?.matchingJourney || [];
      // @ts-ignore
      // Find the effective index (the last route with a receiver, where it will get delivered)
      const effectiveIndex = matchingJourney.findLastIndex((item) => (item.route as Route).receiver);

      matchingJourney.forEach((journeyItem, index) => {
        const route = journeyItem.route;

        if (!processedRouteIds.has(route.id)) {
          processedRouteIds.add(route.id);

          const isEffective = index === effectiveIndex;

          routesToRender.push({
            route,
            level: index, // Use journey index as hierarchy level
            isEffective,
          });
        }
      });
    });

    return routesToRender;
  };

  const routesToRender = processAllMatchedRoutes();

  return (
    <div className={styles.routeTree}>
      {routesToRender.map((routeInfo, index) => {
        const { route, level, isEffective } = routeInfo;
        return (
          <div key={index} style={{ marginLeft: level * 16 }}>
            <RouteNode
              route={route}
              level={level}
              routingStops={level > 0 && !route.continue}
              isEffective={isEffective}
            />
          </div>
        );
      })}
    </div>
  );
};

const RouteNode: React.FC<{
  route: Route;
  level: number;
  routingStops?: boolean;
  isEffective?: boolean;
}> = ({ route, level, routingStops, isEffective = false }) => {
  const styles = useStyles2(getStyles);
  const hasMatchers = route.matchers && route.matchers.length > 0;
  const isDefaultPolicy = level === 0 && !hasMatchers;
  const policyInfo = getPolicyIdentifier(route, isDefaultPolicy);

  return (
    <div className={styles.routeNode} style={{ marginLeft: level * 16 }}>
      <div className={styles.routeHeader}>
        <div className={styles.routeInfo}>
          <div className={cx(styles.badge, {
            [styles.matchers]: policyInfo.type === 'matchers',
            [styles.matchesAll]: policyInfo.type === 'matchesAll',
          })}>
            <Text variant="bodySmall">
              <strong>{policyInfo.text}</strong>
            </Text>
          </div>
          {routingStops && (
            <Tooltip content="This policy is configured to stop after this match">
              <span>
                <Text variant="bodySmall" color="secondary">
                  ⏹️
                </Text>
              </span>
            </Tooltip>
          )}
        </div>
        <div className={styles.routeDetails}>
          {route.receiver && isEffective && (
            <div className={styles.contactPointDisplay}>
              <Icon name="arrow-right" size="sm" />
              <Text variant="bodySmall">
                <strong>Sent to</strong>
              </Text>
              <TextLink
                href={`/alerting/notifications/receivers/${encodeReceiverForUrl(route.receiver)}/edit`}
                external={true}
                variant="bodySmall"
                className={styles.contactPointLink}
              >
                {route.receiver}
              </TextLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  routeTree: css({
    marginTop: theme.spacing(1),
  }),

  routeNode: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.primary,
  }),

  routeHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5),
  }),

  routeInfo: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flex: 1,
  }),

  badge: css({
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
  }),

  matchers: css({
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.primary.contrastText,
  }),

  matchesAll: css({
    backgroundColor: theme.colors.background.canvas,
    color: theme.colors.text.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    fontStyle: 'italic',
  }),

  routeDetails: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),

  contactPointDisplay: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.emphasize(theme.colors.background.primary, 0.03),
  }),

  contactPointLink: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
  }),
});
