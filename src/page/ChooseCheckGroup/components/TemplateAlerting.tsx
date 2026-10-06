import React from 'react';
import { Text, TextLink } from '@grafana/ui';
import { trackLinkClick } from 'features/tracking/linkEvents';

import { useAlertAccessControl } from 'hooks/useAlertAccessControl';

function NotificationLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TextLink
      href={href}
      external
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

export function TemplateAlerting() {
  const { canWriteAlerts } = useAlertAccessControl();
  return (
    <Text color={canWriteAlerts ? 'secondary' : 'warning'}>
      {canWriteAlerts ? (
        <>
          Creates a browser check with alerts on failure, routed through your{' '}
          <NotificationLink href="/alerting/routes">notification policies</NotificationLink>.
        </>
      ) : (
        'Creates a browser check without alerts. You don’t have permission to configure alerts. Ask an administrator to enable them afterward.'
      )}
    </Text>
  );
}
