import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { type ContactPoint, ContactPointSelector, notificationsAPIv1beta1, useListContactPoints } from '@grafana/alerting/unstable';
import { Alert, Button, Field, Stack, Text, TextLink } from '@grafana/ui';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Keep this selection outside the check form: this prototype never writes routing.
const ContactPointPrototypeContent = () => {
  const [selected, setSelected] = useState<ContactPoint | null>(null);
  const { currentData, isError, isLoading, refetch } = useListContactPoints();

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
      {selected && <Text>Preview destination: {selected.spec.title}. Current routing below still applies.</Text>}
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
