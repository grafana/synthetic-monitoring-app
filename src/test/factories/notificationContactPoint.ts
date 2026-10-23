import { type Receiver } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { Factory } from 'fishery';

export const notificationContactPointFactory = Factory.define<Receiver>(({ sequence }) => ({
  apiVersion: 'notifications.alerting.grafana.app/v1beta1',
  kind: 'Receiver',
  metadata: { name: `contact-point-${sequence}` },
  spec: {
    title: 'grafana-default-email',
    integrations: [{ type: 'email', version: 'v1', settings: { addresses: 'oncall@example.com' } }],
  },
}));
