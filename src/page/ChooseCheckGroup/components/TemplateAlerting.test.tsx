import React from 'react';
import { screen, within } from '@testing-library/react';
import { notificationContactPointFactory } from 'test/factories/notificationContactPoint';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import {
  DEFAULT_NOTIFICATION_CONTACT_POINT,
  DEFAULT_NOTIFICATION_TREE,
  SECOND_NOTIFICATION_CONTACT_POINT,
  UNCONFIGURED_NOTIFICATION_CONTACT_POINT,
} from 'test/fixtures/notificationRouting';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckAlertDraft, CheckAlertType } from 'types';

import { TemplateAlerting } from './TemplateAlerting';
import { useTemplateAlerting } from './useTemplateAlerting';

const presets: CheckAlertDraft[] = [
  { name: CheckAlertType.ProbeFailedExecutionsTooHigh, threshold: 2, period: '5m' },
  { name: CheckAlertType.TLSTargetCertificateCloseToExpiring, threshold: 14 },
];

function HttpTemplate() {
  const state = useTemplateAlerting(BASIC_HTTP_CHECK, presets);
  return <TemplateAlerting state={state} />;
}

it('supports another check type with multiple presets and keeps each alert’s recipients separate', async () => {
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [DEFAULT_NOTIFICATION_CONTACT_POINT, SECOND_NOTIFICATION_CONTACT_POINT], metadata: {} },
      }),
    }),
    apiRoute('listNotificationRoutingTrees', {
      result: () => ({
        json: {
          items: [
            {
              ...DEFAULT_NOTIFICATION_TREE,
              spec: {
                ...DEFAULT_NOTIFICATION_TREE.spec,
                routes: [
                  {
                    matchers: [{ label: 'alertname', type: '=', value: 'ProbeFailedExecutionsTooHigh [5m]' }],
                    receiver: SECOND_NOTIFICATION_CONTACT_POINT.spec.title,
                    continue: false,
                  },
                ],
              },
            },
          ],
          metadata: {},
        },
      }),
    })
  );
  const { user } = render(<HttpTemplate />);
  const failures = await screen.findByRole('group', { name: 'Alert on check failure' });
  const certificate = screen.getByRole('group', { name: 'Alert before the TLS certificate expires' });
  expect(within(failures).getByRole('checkbox')).toBeChecked();
  expect(within(certificate).getByRole('checkbox')).toBeChecked();
  expect(within(failures).getByText('At least 2 failed probe executions within 5 min.')).toBeInTheDocument();
  expect(within(certificate).getByText('Certificate expires in fewer than 14 days.')).toBeInTheDocument();
  expect(
    within(failures).getByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })
  ).toBeInTheDocument();
  expect(within(failures).queryByRole('link', { name: 'grafana-default-email' })).not.toBeInTheDocument();
  expect(within(certificate).getByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();
  expect(
    within(certificate).queryByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })
  ).not.toBeInTheDocument();
  await user.click(within(certificate).getByRole('checkbox'));
  expect(within(certificate).queryByRole('link')).not.toBeInTheDocument();
  expect(
    within(failures).getByRole('link', { name: SECOND_NOTIFICATION_CONTACT_POINT.spec.title })
  ).toBeInTheDocument();
});

it('guides users to finish an existing notification setup and hides the notice when alerts are off', async () => {
  const existingContactPoint = notificationContactPointFactory.build({ spec: { title: 'Synthetic Monitoring email' } });
  server.use(
    apiRoute('listNotificationContactPoints', {
      result: () => ({
        json: { items: [UNCONFIGURED_NOTIFICATION_CONTACT_POINT, existingContactPoint], metadata: {} },
      }),
    })
  );
  const { user } = render(<HttpTemplate />);
  const notice = await screen.findByRole('status', { name: 'Notification setup needs attention' });
  expect(within(notice).getByRole('link', { name: 'Synthetic Monitoring email' })).toBeInTheDocument();
  expect(within(notice).getByRole('link', { name: 'Review notification policies' })).toHaveAttribute(
    'href',
    '/alerting/routes'
  );
  expect(screen.queryByRole('textbox', { name: /Email addresses/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Alert on check failure' }));
  await user.click(screen.getByRole('checkbox', { name: 'Alert before the TLS certificate expires' }));
  expect(screen.queryByRole('status', { name: 'Notification setup needs attention' })).not.toBeInTheDocument();
  expect(screen.getByText(/Alerts are off for this check/)).toBeInTheDocument();
});
