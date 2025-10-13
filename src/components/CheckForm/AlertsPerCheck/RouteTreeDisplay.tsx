import React from 'react';
import { type InstanceMatchResult, type Route } from '@grafana/alerting/unstable';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

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
          <div key={route.id || `route-${level}-${index}`} style={{ marginLeft: level * 16 }}>
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

  const badgeClass = policyInfo.type === 'matchesAll' ? styles.matchesAllBadge : styles.matchersBadge;

  return (
    <div key={route.id || `route-${level}`} className={styles.routeNode} style={{ marginLeft: level * 16 }}>
      <div className={styles.routeHeader}>
        <div className={styles.routeInfo}>
          <div className={badgeClass}>
            <Text variant="bodySmall">
              <strong>{policyInfo.text}</strong>
            </Text>
          </div>
          {routingStops && (
            <Tooltip content="The policy is configured with continue=false">
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
            <Text variant="bodySmall">
              Delivered to{' '}
              <TextLink
                href={`/alerting/notifications/receivers/${encodeReceiverForUrl(route.receiver)}/edit`}
                external={true}
                variant="bodySmall"
              >
                {route.receiver}
              </TextLink>
            </Text>
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

  matchersBadge: css({
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.primary.contrastText,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
  }),

  matchesAllBadge: css({
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    backgroundColor: theme.colors.background.canvas,
    color: theme.colors.text.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontStyle: 'italic',
  }),

  routeDetails: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
});
