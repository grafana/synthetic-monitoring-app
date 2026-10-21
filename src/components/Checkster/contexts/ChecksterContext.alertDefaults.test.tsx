import React from 'react';
import { screen, within } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckAlertType } from 'types';
import { Checkster } from 'components/Checkster';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';

const draft = { ...BASIC_HTTP_CHECK, id: undefined, alerts: undefined, frequency: 60000 };
const failedAlert = {
  ...BASIC_CHECK_ALERTS.alerts[0],
  name: CheckAlertType.ProbeFailedExecutionsTooHigh,
  threshold: 2,
  period: '10m',
  status: 'OK' as const,
};

it.each([
  { name: 'new prefilled check', check: draft, isDuplicate: false, selected: true, period: '5 min' },
  {
    name: 'hourly prefilled check',
    check: { ...draft, frequency: 3600000 },
    isDuplicate: false,
    selected: true,
    period: '1 h',
  },
  { name: 'explicit opt-out', check: { ...draft, alerts: [] }, isDuplicate: false, selected: false, period: '5 min' },
  {
    name: 'explicit alert settings',
    check: { ...draft, alerts: [failedAlert] },
    isDuplicate: false,
    selected: true,
    period: '10 min',
  },
  { name: 'duplicate without alerts', check: draft, isDuplicate: true, selected: false, period: '5 min' },
  {
    name: 'existing check without alerts',
    check: { ...draft, id: BASIC_HTTP_CHECK.id },
    isDuplicate: false,
    selected: false,
    period: '5 min',
  },
])('preserves the intended alert defaults for $name', async ({ check, isDuplicate, selected, period }) => {
  const { user } = render(
    <Checkster check={check} isDuplicate={isDuplicate} isPrefilled={!check.id && !isDuplicate} onSave={jest.fn()} />
  );
  await screen.findByTestId(CHECKSTER_TEST_ID.navigation.root);
  await gotoSection(user, FormSectionName.Alerting);
  const failedChecks = await screen.findByRole('group', { name: 'Failed Checks' });
  expect(within(failedChecks).getByRole('checkbox', { name: 'Failed Checks' })).toHaveProperty('checked', selected);
  expect(within(failedChecks).getByRole('combobox', { name: 'Failed Checks period' })).toHaveValue(period);
  if (selected) {
    await user.click(within(failedChecks).getByRole('checkbox', { name: 'Failed Checks' }));
    await gotoSection(user, FormSectionName.Execution);
    await gotoSection(user, FormSectionName.Alerting);
    expect(await screen.findByRole('checkbox', { name: 'Failed Checks' })).not.toBeChecked();
  }
});

it('adjusts an implicit alert window when the frequency of a prefilled check changes', async () => {
  const { user } = render(<Checkster check={{ ...draft, frequency: 600000 }} isPrefilled onSave={jest.fn()} />);
  await screen.findByTestId(CHECKSTER_TEST_ID.navigation.root);
  await gotoSection(user, FormSectionName.Execution);
  await user.click(screen.getByRole('tab', { name: 'Custom' }));
  const minutes = screen.getByRole('textbox', { name: 'Minutes' });
  await user.clear(minutes);
  await user.type(minutes, '60');
  await user.tab();
  await gotoSection(user, FormSectionName.Alerting);
  expect(await screen.findByRole('combobox', { name: 'Failed Checks period' })).toHaveValue('1 h');
});
