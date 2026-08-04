import { Faro } from '@grafana/faro-web-sdk';
import { EchoBackend, EchoEventType, InteractionEchoEvent, registerEchoBackend } from '@grafana/runtime';

// events created via createSMEventFactory all share this prefix
const INTERACTION_PREFIX = 'synthetic-monitoring_';

// faro event attributes must be strings
function toEventAttributes(properties: Record<string, unknown> = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)])
  );
}

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
        faro.api.pushEvent(event.payload.interactionName, toEventAttributes(event.payload.properties));
      }
    },
    // faro batches internally, nothing to flush
    flush: () => {},
  };

  registerEchoBackend(backend);
}
