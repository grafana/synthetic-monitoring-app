import React, { useId } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Box,
  Checkbox,
  Field,
  Icon,
  LoadingPlaceholder,
  Stack,
  Text,
  TextArea,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { trackLinkClick } from 'features/tracking/linkEvents';

import { CheckAlertDraft, CheckAlertType } from 'types';
import { encodeReceiverForUrl } from 'components/CheckForm/AlertsPerCheck/alertRoutingUtils';
import { ALERT_PERIODS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';
import { ExistingNotificationSetupNotice } from 'components/CheckForm/AlertsPerCheck/ExistingNotificationSetupNotice';
import { NotificationRouting } from 'components/CheckForm/AlertsPerCheck/notificationRouting';

import { TemplateAlertingState } from './useTemplateAlerting';

function NotificationLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TextLink
      href={href}
      external
      variant="bodySmall"
      onClick={() => {
        const url = new URL(href, window.location.origin);
        trackLinkClick({
          href: url.href,
          hostname: url.hostname,
          path: url.pathname,
          search: url.search,
          source: 'check-template-alerting',
        });
      }}
    >
      {children}
    </TextLink>
  );
}

const alertTitles: Record<CheckAlertType, string> = {
  [CheckAlertType.ProbeFailedExecutionsTooHigh]: 'Alert on check failure',
  [CheckAlertType.TLSTargetCertificateCloseToExpiring]: 'Alert before the TLS certificate expires',
  [CheckAlertType.HTTPRequestDurationTooHighAvg]: 'Alert on HTTP latency',
  [CheckAlertType.PingRequestDurationTooHighAvg]: 'Alert on ping latency',
  [CheckAlertType.DNSRequestDurationTooHighAvg]: 'Alert on DNS latency',
};

function describeAlert(alert: CheckAlertDraft) {
  const period = ALERT_PERIODS.find(({ value }) => value === alert.period)?.label ?? alert.period;
  if (alert.name === CheckAlertType.ProbeFailedExecutionsTooHigh) {
    return `At least ${alert.threshold} failed probe execution${alert.threshold === 1 ? '' : 's'} within ${period}.`;
  }
  if (alert.name === CheckAlertType.TLSTargetCertificateCloseToExpiring) {
    return `Certificate expires in fewer than ${alert.threshold} days.`;
  }
  return `Average request duration reaches ${alert.threshold} ms over ${period}.`;
}

function Destinations({ preview }: { preview: NotificationRouting }) {
  if (preview.status === 'unknown') {
    return (
      <Text color="secondary" variant="bodySmall" weight="regular">
        Notification routing could not be verified.{' '}
        <NotificationLink href="/alerting/routes">Review in Alerting</NotificationLink>
      </Text>
    );
  }
  if (preview.status === 'missing' && preview.usesDefaultPolicyOnly) {
    return (
      <Text color="warning" variant="bodySmall">
        No notification destination configured.
      </Text>
    );
  }
  return (
    <Stack direction="column" gap={0.5}>
      <Stack direction="row" alignItems="center" wrap="wrap" gap={1}>
        <Text color="secondary" variant="bodySmall">
          <Icon name="bell" size="sm" /> Notify
        </Text>
        {preview.destinations.map(({ name, status }) => (
          <Stack key={name} direction="row" alignItems="center" gap={0.5}>
            <NotificationLink href={`/alerting/notifications/receivers/${encodeReceiverForUrl(name)}/edit`}>
              {name}
            </NotificationLink>
            {status === 'missing' && (
              <Text color="warning" variant="bodySmall">
                Not configured
              </Text>
            )}
          </Stack>
        ))}
      </Stack>
      {preview.status === 'missing' && (
        <Text color="warning" variant="bodySmall">
          {preview.destinations.some(({ status }) => status === 'configured')
            ? 'Some destinations are not configured. Notifications may not reach all intended recipients.'
            : 'Alerts may fire without notifying anyone.'}
        </Text>
      )}
    </Stack>
  );
}

export function TemplateAlerting({ state, disabled = false }: { state: TemplateAlertingState; disabled?: boolean }) {
  const styles = useStyles2(getStyles);
  const id = useId();
  const hasAlerts = state.selectedAlerts.length > 0;

  if (!state.alerts.length) {
    return null;
  }
  if (!state.canWriteAlerts) {
    return (
      <Text color="warning">
        You don’t have permission to configure alerts. This check will be created without them. Ask an administrator to
        enable them afterward.
      </Text>
    );
  }
  if (state.isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading template alerting">
        <LoadingPlaceholder text="Checking notification destinations..." />
      </div>
    );
  }
  return (
    <div className={styles.card} role="group" aria-label="Template alerting">
      <div className={styles.content}>
        <Stack direction="column" gap={2}>
          {state.alerts.map((alert) => {
            const selected = state.selectedAlerts.some(({ name }) => name === alert.name);
            return (
              <div key={alert.name} role="group" aria-label={alertTitles[alert.name]}>
                <Checkbox
                  label={alertTitles[alert.name]}
                  checked={selected}
                  disabled={disabled}
                  aria-describedby={selected ? `${id}-${alert.name}` : undefined}
                  onChange={() => state.toggleAlert(alert.name)}
                />
                {selected && (
                  <div className={styles.details}>
                    <Text id={`${id}-${alert.name}`} color="secondary" variant="bodySmall">
                      {describeAlert(alert)}
                    </Text>
                    {!state.showEmailInput && (
                      <Destinations preview={state.previews.get(alert.name) ?? { status: 'unknown' }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!hasAlerts && (
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              padding={1}
              backgroundColor="info"
              borderRadius="default"
              role="status"
            >
              <Text color="info">
                <Icon name="info-circle" />
              </Text>
              <Text color="info" variant="bodySmall">
                Alerts are off for this check. Custom rules in Grafana Alerting are unaffected.
              </Text>
            </Box>
          )}
          {hasAlerts && state.existingContactPoint && (
            <ExistingNotificationSetupNotice contactPointName={state.existingContactPoint.spec.title} />
          )}
          {hasAlerts && state.showEmailInput && (
            <Stack direction="column" gap={1}>
              <Text color={state.canConfigure ? 'secondary' : 'warning'} variant="bodySmall">
                {state.canConfigure
                  ? 'The default contact point isn’t configured. Add email recipients for current and future Synthetic Monitoring checks.'
                  : 'Notification setup could not be verified. Your email draft is preserved.'}
                {!state.canConfigure && (
                  <>
                    {' '}
                    <NotificationLink href="/alerting/routes">Review in Alerting</NotificationLink>
                  </>
                )}
              </Text>
              <Field
                htmlFor={`${id}-emails`}
                label="Email addresses"
                description="Separate addresses with commas, semicolons or new lines."
                invalid={!!state.emailError}
                error={state.emailError}
              >
                <TextArea
                  id={`${id}-emails`}
                  rows={2}
                  value={state.emails}
                  disabled={disabled}
                  placeholder="oncall@example.com, team@example.com"
                  onChange={(event) => state.setEmails(event.currentTarget.value)}
                  onBlur={() => state.validateEmails()}
                />
              </Field>
              <Text color="secondary" variant="bodySmall">
                Leave blank to set up notifications later.
              </Text>
            </Stack>
          )}
        </Stack>
      </div>
      {hasAlerts && (
        <div className={styles.footer}>
          <Text color="secondary" variant="bodySmall">
            Recipients follow your notification policies.{' '}
            <NotificationLink href="/alerting/routes">Manage notifications in Grafana Alerting</NotificationLink>
          </Text>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    background: theme.colors.background.primary,
  }),
  content: css({ padding: theme.spacing(2) }),
  details: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(3),
  }),
  footer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
    padding: theme.spacing(1.5, 2),
  }),
  loading: css({ display: 'flex', alignItems: 'center', minHeight: theme.spacing(16) }),
});
