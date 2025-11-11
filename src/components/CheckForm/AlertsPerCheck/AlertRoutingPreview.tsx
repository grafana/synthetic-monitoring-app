import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMatchInstancesToRouteTrees } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Icon, LoadingPlaceholder, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';

import { AlertLabelsDisplay } from './AlertLabelsDisplay';
import {
  convertLabelsToLabelPairs,
  encodeReceiverForUrl,
  extractMatchersFromRoutes,
  generateAlertLabels,
} from './alertRoutingUtils';
import { RouteTreeDisplay } from './RouteTreeDisplay';

interface AlertRoutingPreviewProps {
  alertType: CheckAlertType;
  alertName: string;
}

export const AlertRoutingPreview: React.FC<AlertRoutingPreviewProps> = ({ alertType }) => {
  const styles = useStyles2(getStyles);
  const { getValues } = useFormContext<CheckFormValues>();

  const checkType = getValues().checkType;
  const frequency = getValues().frequency;
  const customLabels = getValues().labels;
  const job = getValues().job;
  const instance = getValues().target;

  const alertLabels = useMemo(() => {
    return generateAlertLabels(alertType, { checkType, frequency, customLabels, job, instance });
  }, [alertType, checkType, frequency, customLabels, job, instance]);

  const {
    matchInstancesToRouteTrees,
    isLoading,
    isError,
    currentData: routingTreeData,
  } = useMatchInstancesToRouteTrees();

  const routeMatches = useMemo(() => {
    if (!matchInstancesToRouteTrees || isLoading || isError) {
      return [];
    }
    try {
      return matchInstancesToRouteTrees([convertLabelsToLabelPairs(alertLabels)]);
    } catch (error) {
      return [];
    }
  }, [matchInstancesToRouteTrees, isLoading, isError, alertLabels]);

  const highlightMatchers = useMemo(() => {
    return extractMatchersFromRoutes(routeMatches);
  }, [routeMatches]);

  const defaultPolicyInfo = useMemo(() => {
    if (!routingTreeData?.items || routingTreeData.items.length === 0) {
      return null;
    }

    // Find the default routing tree (usually the first one)
    const defaultTree = routingTreeData.items[0];
    if (!defaultTree?.spec?.defaults) {
      return null;
    }

    const defaultReceiver = defaultTree.spec.defaults.receiver;
    if (!defaultReceiver) {
      return null;
    }

    return {
      receiverName: defaultReceiver,
    };
  }, [routingTreeData]);

  if (isLoading) {
    return <LoadingPlaceholder text="Loading routing information..." />;
  }

  if (isError) {
    return (
      <Alert severity="info" title="Notification policies preview unavailable">
        <div>
          <Text variant="body">
            Unable to load notification policy information. This may happen if Grafana alertmanager endpoints are not
            accessible.
          </Text>
        </div>
      </Alert>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="body">
          <strong className={styles.headerTitle}>
            <Icon name="bell" size="md" />
            <span>Alert Routing Summary</span>
          </strong>
        </Text>
        <TextLink
          href="https://grafana.com/docs/grafana/latest/alerting/fundamentals/notification-policies/"
          external={true}
          variant="bodySmall"
        >
          Learn how alert routing works
        </TextLink>
      </div>

      <AlertLabelsDisplay alertLabels={alertLabels} highlightMatchers={highlightMatchers} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text variant="body">
            <strong>Matching notification policies</strong>
          </Text>

          <div className={styles.infoSection}>
            <Text variant="body" color="secondary">
              Notification policies determine which contact point receives this alert based on the labels shown above.
              To change where alerts are sent,{' '}
              <TextLink href="/alerting/routes" external={true} variant="body">
                configure notification policies
              </TextLink>{' '}
              in the Alerting section.
            </Text>
          </div>
        </div>

        <div className={styles.routeTreeSection}>
          {routeMatches.length > 0 && routeMatches[0] ? (
            <RouteTreeDisplay routeMatch={routeMatches[0]} />
          ) : (
            <div className={styles.contactPointsSection}>
              <Alert severity="info" title="Default notification policy will be used">
                <div>
                  <Text variant="body">
                    No specific notification policies matched this alert. The alert will be routed using the default
                    notification policy, which handles all alerts that don&apos;t match any specific routing rules.
                  </Text>
                  {defaultPolicyInfo && (
                    <div className={styles.defaultContactPoint}>
                      <Icon name="arrow-right" size="sm" />
                      <Text variant="bodySmall">
                        <strong>Sent to</strong>
                      </Text>
                      <TextLink
                        href={`/alerting/notifications/receivers/${encodeReceiverForUrl(
                          defaultPolicyInfo.receiverName
                        )}/edit`}
                        external={true}
                        variant="bodySmall"
                        className={styles.contactPointLink}
                      >
                        {defaultPolicyInfo.receiverName}
                      </TextLink>
                    </div>
                  )}
                  <div className={styles.configureLink}>
                    <TextLink href="/alerting/routes" external={true} variant="body">
                      Configure notification policies to route to a different contact point
                    </TextLink>
                  </div>
                </div>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
    padding: theme.spacing(2.5),
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    marginTop: theme.spacing(2),
    boxShadow: theme.shadows.z1,
  }),

  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  }),

  headerTitle: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),

  section: css({
    marginBottom: theme.spacing(1.5),
    '&:last-child': {
      marginBottom: 0,
    },
  }),

  sectionHeader: css({
    marginBottom: theme.spacing(1.5),
  }),

  infoSection: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }),

  routeTreeSection: css({
    marginTop: theme.spacing(1),
  }),

  contactPointsSection: css({
    marginTop: theme.spacing(1),
  }),

  defaultContactPoint: css({
    marginTop: theme.spacing(2),
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.emphasize(theme.colors.background.primary, 0.03),
  }),

  contactPointLink: css({
    fontWeight: theme.typography.fontWeightBold,
  }),

  configureLink: css({
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
});
