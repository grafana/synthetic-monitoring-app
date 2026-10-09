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
  const [expandedDestination, setExpandedDestination] = useState<string>();
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

  const destination = result.destinations.find(({ name }) => name === expandedDestination);

  return (
    <div>
      <div className={styles.destinations}>
        <Icon name="bell" size="sm" />
        <Text color="secondary" variant="bodySmall" weight="regular">
          Notify
        </Text>
        {result.destinations.map(({ name, status }) => (
          <div key={name} className={styles.destination}>
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
            <Button
              type="button"
              variant="secondary"
              fill="text"
              size="sm"
              className={styles.previewButton}
              aria-label={`${destination?.name === name ? 'Hide' : 'Show'} routing to ${name}`}
              aria-expanded={destination?.name === name}
              aria-controls={detailsId}
              onClick={() => {
                const expanded = destination?.name !== name;
                setExpandedDestination(expanded ? name : undefined);
                trackRoutingPreviewToggled({ name: alert.type, action: expanded ? 'show' : 'hide' });
              }}
            >
              {destination?.name === name ? 'Hide routing' : 'Show routing'}
              <Icon name={destination?.name === name ? 'angle-up' : 'angle-down'} size="sm" />
            </Button>
          </div>
        ))}
      </div>
      {result.status === 'missing' && (
        <div className={styles.warning}>
          <Text color="warning" variant="bodySmall">
            Notification setup is incomplete. Alerts may fire without notifying anyone.
          </Text>
        </div>
      )}
      {destination && (
        <div
          id={detailsId}
          role="region"
          aria-label={`${destination.name} contact point details`}
          className={styles.details}
        >
          <AlertRoutingPreview alertType={alert.type} contactPointName={destination.name} />
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
    alignItems: 'center',
    gap: theme.spacing(1),
    minWidth: 0,
    maxWidth: '100%',
    overflowWrap: 'anywhere',
  }),
  previewButton: css({
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightRegular,
    marginLeft: theme.spacing(1),
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
