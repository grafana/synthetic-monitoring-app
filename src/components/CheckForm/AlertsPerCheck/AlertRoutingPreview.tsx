import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useFormContext } from 'react-hook-form';
import { USER_DEFINED_TREE_NAME } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';

import { AlertLabelsDisplay } from './AlertLabelsDisplay';
import { generateAlertLabels, getPolicyIdentifier } from './alertRoutingUtils';
import { getMatchingNotificationRoutes } from './notificationRouting';

interface AlertRoutingPreviewProps {
  alertType: CheckAlertType;
  contactPointName: string;
}

const AlertRoutingPreviewContent = ({ alertType, contactPointName }: AlertRoutingPreviewProps) => {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext<CheckFormValues>();
  const { checkType, frequency, labels, job, target, alerts } = watch();
  const labelMode = useLabelMode();
  const routing = useNotificationRouting();
  const period = alerts?.[alertType]?.period;

  const alertLabels = useMemo(
    () =>
      generateAlertLabels(alertType, {
        checkType,
        frequency,
        customLabels: labels,
        job,
        instance: target,
        labelMode: labelMode.data?.mode,
        period,
      }),
    [alertType, checkType, frequency, labels, job, target, labelMode.data?.mode, period]
  );

  const routes = useMemo(() => {
    if (routing.isLoading || routing.isError || labelMode.isLoading || labelMode.isError || !routing.data) {
      return [];
    }
    return (
      getMatchingNotificationRoutes(routing.data.trees, alertLabels)?.filter(
        ({ route }) => 'receiver' in route && route.receiver === contactPointName
      ) ?? []
    );
  }, [
    routing.data,
    routing.isLoading,
    routing.isError,
    labelMode.isLoading,
    labelMode.isError,
    alertLabels,
    contactPointName,
  ]);

  if (routing.isLoading || labelMode.isLoading) {
    return (
      <Text variant="bodySmall" color="secondary">
        Loading routing information...
      </Text>
    );
  }
  if (routes.length === 0) {
    return (
      <Text variant="bodySmall" color="secondary">
        Routing could not be verified. Review notification policies in Grafana Alerting.
      </Text>
    );
  }

  return (
    <div className={styles.preview}>
      <div className={styles.routes}>
        {routes.map(({ route, matchDetails, routeTree }) => (
          <Text key={route.id} variant="bodySmall" color="primary" weight="regular">
            Routes through{' '}
            {matchDetails.matchingJourney.map(({ route }, index) => (
              <React.Fragment key={route.id}>
                {index > 0 && ' → '}
                <TextLink
                  href={`/alerting/routes/policy/${USER_DEFINED_TREE_NAME}/edit?alertmanager=grafana`}
                  external
                  variant="bodySmall"
                  weight="regular"
                >
                  {getPolicyIdentifier(route, index === 0, routeTree.metadata.name).text}
                </TextLink>
              </React.Fragment>
            ))}
          </Text>
        ))}
      </div>
      <AlertLabelsDisplay
        alertLabels={alertLabels}
        highlightMatchers={routes.flatMap(({ matchDetails }) =>
          matchDetails.matchingJourney.flatMap(({ matchDetails }) =>
            matchDetails.flatMap((detail) => (detail.match ? [detail.matcher] : []))
          )
        )}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  preview: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    minWidth: 0,
  }),
  routes: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    overflowWrap: 'anywhere',
  }),
});

export const AlertRoutingPreview = (props: AlertRoutingPreviewProps) => (
  <ErrorBoundary
    fallback={
      <Text variant="bodySmall" color="secondary">
        Routing could not be verified. Review notification policies in Grafana Alerting.
      </Text>
    }
  >
    <AlertRoutingPreviewContent {...props} />
  </ErrorBoundary>
);
