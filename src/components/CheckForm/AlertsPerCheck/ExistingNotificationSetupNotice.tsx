import React from 'react';
import { Text, TextLink } from '@grafana/ui';
import { encodeReceiverForUrl } from 'features/alerting/alertRoutingUtils';

export function ExistingNotificationSetupNotice({ contactPointName }: { contactPointName: string }) {
  return (
    <div role="status" aria-label="Notification setup needs attention">
      <Text color="warning" variant="bodySmall">
        The{' '}
        <TextLink
          href={`/alerting/notifications/receivers/${encodeReceiverForUrl(contactPointName)}/edit`}
          external
          variant="bodySmall"
        >
          {contactPointName}
        </TextLink>{' '}
        contact point already exists, but notifications for Synthetic Monitoring aren’t configured.{' '}
        <TextLink href="/alerting/routes" external variant="bodySmall">
          Review notification policies
        </TextLink>
        .
      </Text>
    </div>
  );
}
