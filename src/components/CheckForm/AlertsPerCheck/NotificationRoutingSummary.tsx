import React, { useId, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Spinner, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackRoutingPreviewToggled } from 'features/tracking/perCheckAlertsEvents';

import { CheckFormValues } from 'types';
import { canSetUpNotifications } from 'data/initialNotificationSetup';
import { useUserPermissions } from 'data/permissions';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';

import { AlertRoutingPreview } from './AlertRoutingPreview';
import { encodeReceiverForUrl, generateAlertLabels } from './alertRoutingUtils';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { inspectNotificationRouting } from './notificationRouting';
import { getNotificationSetupEligibility, parseNotificationEmails, validNotificationEmails } from './notificationSetup';

export function NotificationRoutingSummary({ alert }: { alert: PredefinedAlertInterface }) {
  const styles = useStyles2(getStyles);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const { watch, setFocus, formState } = useFormContext<CheckFormValues>();
  const { checkType, frequency, labels, job, target, alerts, notificationEmails } = watch();
  const routing = useNotificationRouting();
  const labelMode = useLabelMode();
  const { canWriteAlerts } = useUserPermissions();

  if (routing.isLoading || labelMode.isLoading) {
    return (
      <div className={styles.destinations} role="status">
        <Icon name="bell" size="sm" />
        <Text color="secondary" variant="bodySmall" weight="regular">
          Notify
        </Text>
        <Spinner size="sm" />
        <Text color="secondary" variant="bodySmall" weight="regular">
          Checking notification routing...
        </Text>
      </div>
    );
  }

  const setup =
    routing.data && !routing.isError
      ? getNotificationSetupEligibility(routing.data.trees, routing.data.contactPoints)
      : undefined;
  if (
    notificationEmails &&
    validNotificationEmails(notificationEmails) &&
    setup?.status === 'available' &&
    canSetUpNotifications(setup.tree)
  ) {
    return (
      <div className={styles.destinations}>
        <Icon name="bell" size="sm" />
        <Text color="secondary" variant="bodySmall">
          Notify
        </Text>
        <Text variant="bodySmall">{parseNotificationEmails(notificationEmails).join(', ')}</Text>
      </div>
    );
  }

  const result =
    routing.isError || labelMode.isError || !routing.data
      ? ({ status: 'unknown' } as const)
      : inspectNotificationRouting(
          routing.data.trees,
          routing.data.contactPoints,
          generateAlertLabels(alert.type, {
            checkType,
            frequency,
            customLabels: labels,
            job,
            instance: target,
            labelMode: labelMode.data?.mode,
            period: alert.supportsPeriod ? alerts?.[alert.type]?.period : undefined,
          })
        );

  if (result.status === 'unknown') {
    return (
      <div className={styles.destinations}>
        <Text color="secondary" variant="bodySmall" weight="regular">
          Notification routing could not be verified.{' '}
          <TextLink href="/alerting/routes" external variant="bodySmall">
            Review in Alerting
          </TextLink>
        </Text>
      </div>
    );
  }

  if (result.status === 'missing' && result.usesDefaultPolicyOnly) {
    const canConfigure = canWriteAlerts && setup?.status === 'available' && canSetUpNotifications(setup.tree);
    return (
      <div className={styles.destinations}>
        <Text color="warning" variant="bodySmall">
          No notification destination configured
        </Text>
        {canConfigure ? (
          <Button
            type="button"
            variant="secondary"
            fill="text"
            size="sm"
            disabled={formState.disabled}
            onClick={() => setFocus('notificationEmails')}
          >
            Set up notifications
          </Button>
        ) : (
          <TextLink href="/alerting/notifications" external variant="bodySmall">
            Set up notifications
          </TextLink>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.summaryHeader}>
        <div className={styles.summaryDestinations}>
          <span className={styles.notifyLabel}>
            <Icon name="bell" size="sm" className={styles.notifyIcon} />
            <Text color="secondary" variant="bodySmall" weight="regular">
              Notify
            </Text>
          </span>
          <ul className={styles.destinationList} aria-label={`${alert.category} contact points`}>
            {result.destinations.map(({ name, status }, index) => (
              <li key={name} className={styles.destination}>
                <TextLink
                  href={`/alerting/notifications/receivers/${encodeReceiverForUrl(name)}/edit`}
                  external
                  variant="bodySmall"
                  weight="regular"
                >
                  {name}
                </TextLink>
                {status === 'missing' && (
                  <Text color="warning" variant="bodySmall">
                    Not configured
                  </Text>
                )}
                {index < result.destinations.length - 1 && (
                  <span aria-hidden="true" className={styles.separator}>
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          size="sm"
          className={styles.previewButton}
          aria-label={`${expanded ? 'Hide' : 'Show'} routing for ${alert.category}`}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => {
            setExpanded(!expanded);
            trackRoutingPreviewToggled({ name: alert.type, action: expanded ? 'hide' : 'show' });
          }}
        >
          {expanded ? 'Hide routing' : 'Show routing'}
          <Icon name={expanded ? 'angle-up' : 'angle-down'} size="sm" />
        </Button>
      </div>
      {result.status === 'missing' && (
        <div className={styles.warning}>
          <Text color="warning" variant="bodySmall">
            {result.destinations.some(({ status }) => status === 'configured')
              ? 'Some contact points are not configured. Notifications may not reach all intended recipients.'
              : 'Notification setup is incomplete. Alerts may fire without notifying anyone.'}
          </Text>
        </div>
      )}
      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-label={`${alert.category} notification routing`}
          className={styles.details}
        >
          <AlertRoutingPreview alertType={alert.type} />
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  summaryHeader: css({
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 2),
  }),
  summaryDestinations: css({
    display: 'flex',
    flex: '1 1 24rem',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  notifyLabel: css({
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    flexShrink: 0,
    color: theme.colors.text.secondary,
  }),
  notifyIcon: css({
    alignSelf: 'center',
  }),
  destinationList: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing(0.5, 1),
    listStyle: 'none',
    padding: 0,
    margin: 0,
    minWidth: 0,
  }),
  destinations: css({
    display: 'flex',
    minHeight: theme.spacing(3),
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    color: theme.colors.text.secondary,
  }),
  destination: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minWidth: 0,
    maxWidth: '100%',
    overflowWrap: 'anywhere',
  }),
  separator: css({
    color: theme.colors.text.secondary,
  }),
  previewButton: css({
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightRegular,
    marginLeft: 'auto',
    flexShrink: 0,
    padding: theme.spacing(0, 0.5),
    gap: theme.spacing(0.5),
    maxWidth: '100%',
    height: 'auto',
    minHeight: theme.spacing(3),
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  }),
  warning: css({
    marginTop: theme.spacing(0.5),
  }),
  details: css({
    padding: theme.spacing(2, 0, 1),
  }),
});
