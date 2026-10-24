import { screen } from '@testing-library/react';
import { selectOption } from 'test/utils';

import { AlertSensitivity } from 'types';
import { formTestRenderer } from 'components/Checkster/components/form/__test__/formTestRenderer';

import { CheckFormAlert } from './CheckFormAlert';

const getSensitivitySelect = () => screen.getByRole('combobox', { name: 'Select alert sensitivity' });

it('links to the alerts tab without offering to create default rules', () => {
  formTestRenderer(CheckFormAlert, {}, { alertSensitivity: AlertSensitivity.None });

  const alertsTabLink = screen.getByRole('link', { name: 'alerts tab.' });
  expect(alertsTabLink).toHaveAttribute('href', '/a/grafana-synthetic-monitoring-app/alerts');
  expect(alertsTabLink).toHaveAttribute('target', '_blank');
  expect(screen.getByText(/Default rules are listed in the/)).toBeInTheDocument();
  expect(screen.queryByText(/can be created/)).not.toBeInTheDocument();
});

it('lets users choose one of the standard sensitivities', async () => {
  const user = formTestRenderer(CheckFormAlert, {}, { alertSensitivity: AlertSensitivity.Medium });

  expect(getSensitivitySelect()).toBeEnabled();
  expect(getSensitivitySelect()).toHaveValue('Medium');

  await selectOption(user, { label: 'Select alert sensitivity', option: 'High' });

  expect(getSensitivitySelect()).toHaveValue('High');
});

it('locks a sensitivity that is not one of the standard options', () => {
  formTestRenderer(CheckFormAlert, {}, { alertSensitivity: 'critical' });

  expect(getSensitivitySelect()).toBeDisabled();
  expect(getSensitivitySelect()).toHaveValue('critical');
});

it('locks the sensitivity while the form is disabled', () => {
  formTestRenderer(CheckFormAlert, {}, { alertSensitivity: AlertSensitivity.Medium, disabled: true });

  expect(getSensitivitySelect()).toBeDisabled();
});
