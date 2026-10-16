import React from 'react';
import { type InstanceMatchResult, type LabelMatcher, type Route, USER_DEFINED_TREE_NAME } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackLinkClick } from 'features/tracking/linkEvents';

import { encodeReceiverForUrl, getPolicyIdentifier } from './alertRoutingUtils';

interface RouteTreeDisplayProps {
  routeMatch: Pick<InstanceMatchResult, 'matchedRoutes'>;
}

interface MatchedPolicyNode {
  route: Route & { id: string };
  treeName: string;
  receiver?: string;
  children: Map<string, MatchedPolicyNode>;
}

export const RouteTreeDisplay = ({ routeMatch }: RouteTreeDisplayProps) => {
  const styles = useStyles2(getStyles);
  const roots = new Map<string, MatchedPolicyNode>();

  // Merge shared ancestors, retaining every matched branch even when several
  // branches use the same receiver. Only terminal matches handle the alert.
  for (const { route: matchedRoute, matchDetails, routeTree } of routeMatch.matchedRoutes) {
    const treeName = routeTree.metadata.name ?? USER_DEFINED_TREE_NAME;
    let siblings = roots;
    for (const { route } of matchDetails.matchingJourney) {
      const key = `${treeName}::${route.id}`;
      let node = siblings.get(key);
      if (!node) {
        node = { route, treeName, children: new Map() };
        siblings.set(key, node);
      }
      if (route.id === matchedRoute.id && 'receiver' in matchedRoute && typeof matchedRoute.receiver === 'string') {
        // The routing matcher has already resolved contact point inheritance.
        node.receiver = matchedRoute.receiver;
      }
      siblings = node.children;
    }
  }

  if (roots.size === 0) {
    return <Text variant="bodySmall">No routing information available.</Text>;
  }

  return (
    <ul className={styles.routeTree} aria-label="Matched notification policies">
      {Array.from(roots, ([key, node]) => (
        <RouteNode key={key} node={node} isRoot />
      ))}
    </ul>
  );
};

const RouteNode = ({ node, isRoot = false }: { node: MatchedPolicyNode; isRoot?: boolean }) => {
  const styles = useStyles2(getStyles);
  const { route, receiver, treeName, children } = node;
  const policyInfo = getPolicyIdentifier(route, isRoot, treeName);
  const matchers: LabelMatcher[] = route.matchers ?? [];
  const receiverPath = receiver ? `/alerting/notifications/receivers/${encodeReceiverForUrl(receiver)}/edit` : '';

  return (
    <li className={styles.treeItem}>
      <div className={cx(styles.routeRow, receiver ? styles.destinationNode : styles.branchHeading)}>
        <div className={styles.policyLink}>
          <TextLink
            href={`/alerting/routes/policy/${encodeURIComponent(treeName)}/edit?alertmanager=grafana`}
            external
            inline={false}
            color="primary"
            variant="bodySmall"
            weight={isRoot ? 'medium' : 'regular'}
            aria-label={policyInfo.text}
          >
            {matchers.length > 0 && !isRoot
              ? matchers.map(({ label, type, value }) => (
                  <span
                    key={`${label}:${type}:${value}`}
                    className={cx(styles.matcher, { [styles.branchMatcher]: !receiver })}
                  >
                    {`${label} ${type} ${value}`}
                  </span>
                ))
              : policyInfo.text}
          </TextLink>
        </div>
        {receiver && (
          <span className={styles.destination}>
            <Icon name="at" size="sm" />
            <Text variant="bodySmall" color="secondary" weight="regular">
              Routes to
            </Text>
            <TextLink
              href={receiverPath}
              external
              inline={false}
              variant="bodySmall"
              weight="medium"
              onClick={() => {
                const url = new URL(receiverPath, window.location.origin);
                trackLinkClick({
                  href: url.href,
                  hostname: url.hostname,
                  path: url.pathname,
                  search: url.search,
                  source: 'alert-routing-preview-route-receiver',
                });
              }}
            >
              {receiver}
            </TextLink>
          </span>
        )}
      </div>
      {children.size > 0 && (
        <ul className={styles.branches}>
          {Array.from(children, ([key, child]) => (
            <RouteNode key={key} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  routeTree: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    listStyle: 'none',
    padding: 0,
    margin: 0,
    minWidth: 0,
  }),
  branches: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    listStyle: 'none',
    position: 'relative',
    margin: theme.spacing(1, 0, 0, 3),
    padding: 0,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: theme.spacing(0.5),
      left: theme.spacing(-2),
      borderLeft: `2px solid ${theme.colors.border.medium}`,
      pointerEvents: 'none',
    },
  }),
  treeItem: css({
    position: 'relative',
    minWidth: 0,
  }),
  routeRow: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    minWidth: 0,
    overflowWrap: 'anywhere',
  }),
  branchHeading: css({
    padding: theme.spacing(0.5, 0),
  }),
  destinationNode: css({
    padding: theme.spacing(1, 1.5),
    backgroundColor: theme.flags.visualDesignRefresh
      ? theme.colors.background.primary
      : theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.lg,
  }),
  policyLink: css({
    minWidth: 0,
    maxWidth: '100%',
  }),
  matcher: css({
    display: 'inline-block',
    maxWidth: '100%',
    verticalAlign: 'middle',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(0.33, 0.66),
    marginRight: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    whiteSpace: 'pre',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }),
  branchMatcher: css({
    backgroundColor: theme.colors.background.primary,
  }),
  destination: css({
    display: 'inline-flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    minWidth: 0,
    color: theme.colors.text.secondary,
  }),
});
