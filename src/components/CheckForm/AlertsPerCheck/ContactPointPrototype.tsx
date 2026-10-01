import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { type ContactPoint, ContactPointSelector, type Integration, notificationsAPIv1beta1, useListContactPoints } from '@grafana/alerting/unstable';
import { Alert, Button, Field, Stack, Text, TextLink } from '@grafana/ui';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { encodeReceiverForUrl } from './alertRoutingUtils';

function describeDestination(integration: Integration): string {
  // Only display known destination fields; URLs and credentials can contain secrets.
  switch (integration.type) {
    case 'email': {
      const addresses = integration.settings.addresses;
      return typeof addresses === 'string' && addresses.trim()
        ? `Email: ${addresses}`
        : 'Email: recipient details unavailable';
    }
    case 'slack': {
      const recipient = integration.settings.recipient;
      return typeof recipient === 'string' && recipient.trim()
        ? `Slack: ${recipient}`
        : 'Slack: destination details unavailable';
    }
    case 'pagerduty':
      return 'PagerDuty integration';
    default:
      return `${integration.type} integration — view destination in Grafana Alerting`;
  }
}

// Keep this selection outside the check form: this prototype never writes routing.
const ContactPointPrototypeContent = () => {
  const [selected, setSelected] = useState<ContactPoint | null>(null);
  const { currentData, isError, isLoading, refetch } = useListContactPoints();
  const selectedContactPoint: ContactPoint | undefined = selected
    ? currentData?.items.find((contactPoint: ContactPoint) => contactPoint.metadata.name === selected.metadata.name)
    : undefined;

  return (
    <Stack direction="column" gap={2}>
      <Alert severity="info" title="Contact point selection prototype">
        Try selecting a destination for the alerts on this check. This selection is not saved and does not change notification
        routing.
      </Alert>
      {isError ? (
        <Alert severity="warning" title="Unable to load contact points">
          Check your Grafana Alerting permissions and try again.
        </Alert>
      ) : (
        <Field label="Contact point" description="Select an existing Grafana Alerting contact point.">
          <ContactPointSelector
            aria-label="Contact point"
            isClearable
            value={selected ? (selected.metadata.uid ?? selected.spec.title) : null}
            onChange={setSelected}
            placeholder="Choose a contact point"
            width={40}
          />
        </Field>
      )}
      {!isLoading && !isError && currentData?.items.length === 0 && (
        <Text>No contact points found. Create one in Grafana Alerting, then refresh.</Text>
      )}
      {selectedContactPoint && (
        <Stack direction="column" gap={1}>
          <Text weight="medium">Destinations for {selectedContactPoint.spec.title}</Text>
          {selectedContactPoint.spec.integrations.length > 0 ? (
            <ul>
              {selectedContactPoint.spec.integrations.map((integration: Integration, index: number) => (
                <li key={index}>{describeDestination(integration)}</li>
              ))}
            </ul>
          ) : (
            <Text>This contact point has no integrations and will not send notifications.</Text>
          )}
          <TextLink
            href={`/alerting/notifications/receivers/${encodeReceiverForUrl(selectedContactPoint.spec.title)}/edit`}
            external
          >
            View contact point details
          </TextLink>
          <Text color="secondary">Preview only. Existing notification routing still applies.</Text>
        </Stack>
      )}
      <Stack gap={2}>
        <TextLink href="/alerting/notifications" external>
          Manage contact points
        </TextLink>
        <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
          Refresh contact points
        </Button>
      </Stack>
    </Stack>
  );
};

export const ContactPointPrototype = () => {
  // The bundled alerting API needs its own reducer and middleware, rather than
  // relying on Grafana's host store having the same generated API instance.
  const [store] = useState(() =>
    configureStore({
      reducer: { [notificationsAPIv1beta1.reducerPath]: notificationsAPIv1beta1.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(notificationsAPIv1beta1.middleware),
    })
  );
  useEffect(() => setupListeners(store.dispatch), [store]);

  return (
    <ErrorBoundary fallback={<Alert severity="warning" title="Contact point selector unavailable" />}>
      <Provider store={store}>
        <ContactPointPrototypeContent />
      </Provider>
    </ErrorBoundary>
  );
};
