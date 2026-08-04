import { stringifyObjectValues } from '@grafana/faro-core';
import { Faro } from '@grafana/faro-web-sdk';
import { EchoBackend, EchoEventType, InteractionEchoEvent, registerEchoBackend } from '@grafana/runtime';

// events created via createSMEventFactory all share this prefix
const INTERACTION_PREFIX = 'synthetic-monitoring_';

let registered = false;

// mirrors this plugin's reportInteraction (rudderstack) events into faro as events
export function registerFaroInteractionEchoBackend(faro: Faro) {
  if (registered) {
    return;
  }
  registered = true;

  const backend: EchoBackend<InteractionEchoEvent, {}> = {
    options: {},
    supportedEvents: [EchoEventType.Interaction],
    addEvent: (event) => {
      if (event.payload.interactionName.startsWith(INTERACTION_PREFIX)) {
        // faro event attributes must be strings
        faro.api.pushEvent(event.payload.interactionName, stringifyObjectValues(event.payload.properties));
      }
    },
    // faro batches internally, nothing to flush
    flush: () => {},
  };

  registerEchoBackend(backend);
}
