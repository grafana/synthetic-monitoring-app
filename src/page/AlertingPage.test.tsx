import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { type UserEvent } from '@testing-library/user-event';
import { render } from 'test/render';

import { AlertFamily, AlertRule, AlertSensitivity } from 'types';
import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY,
} from 'components/constants';
import { AlertingPage } from 'page/AlertingPage';

jest.mock('hooks/useAlerts', () => {
  const { defaultRules } = jest.requireActual('hooks/useAlerts');
  const useAlertsMock = jest
    .fn()
    .mockImplementationOnce(() => ({
      alertRules: [],
      alertError: '',
      setDefaultRules,
      setRules,
    }))
    .mockImplementation(() => ({
      alertRules: defaultRules.rules as AlertRule[],
      alertError: '',
      setDefaultRules,
      setRules,
    }));
  return { useAlerts: useAlertsMock, defaultRules };
});

jest.setTimeout(30000);

const setDefaultRules = jest.fn();
const setRules = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));

const renderAlerting = () => {
  return render(<AlertingPage />);
};

const toggleSection = async (sectionName: string, user: UserEvent): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  await user.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

it('adds default alerts and edits alerts', async () => {
  const { user } = renderAlerting();
  const defaultAlertButton = await screen.findByRole('button', { name: 'Populate default alerts' });
  await user.click(defaultAlertButton);
  await waitFor(() => expect(defaultAlertButton).not.toBeDisabled());
  expect(setDefaultRules).toHaveBeenCalledTimes(1);

  const button = await screen.findByRole('button', {
    name: DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.High],
  });
  await user.click(button);

  const alertNameInput = await screen.findByLabelText('Alert name');
  expect(alertNameInput).toHaveValue(
    DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.High]
  );
  await user.clear(alertNameInput);
  await user.type(alertNameInput, 'A different name');

  const probePercentage = await screen.findByTestId('probePercentage');
  expect(probePercentage).toHaveValue(95);
  await user.clear(probePercentage);
  await user.type(probePercentage, '25');

  const timeCount = await screen.findByTestId('timeCount');
  expect(timeCount).toHaveValue(5);
  await user.clear(timeCount);
  await user.type(timeCount, '2');

  const timeUnit = await screen.findAllByTestId('select');
  await user.selectOptions(timeUnit[1], 's');

  const labels = await toggleSection('Labels', user);
  const addLabelButton = await within(labels).findByRole('button', { name: 'Add label' });
  await user.click(addLabelButton);
  const labelNameInputs = await within(labels).findAllByPlaceholderText('Name');
  await user.type(labelNameInputs[labelNameInputs.length - 1], 'a_label_name');
  const labelValueInputs = await within(labels).findAllByPlaceholderText('Value');
  await user.type(labelValueInputs[labelValueInputs.length - 1], 'a_label_value');

  const annotations = await toggleSection('Annotations', user);
  const addAnnotationsButton = await within(annotations).findByRole('button', { name: 'Add annotation' });
  await user.click(addAnnotationsButton);
  const annotationNameInputs = await within(annotations).findAllByPlaceholderText('Name');
  await user.type(annotationNameInputs[annotationNameInputs.length - 1], 'an_annotation_name');
  const annotationValueInputs = await within(annotations).findAllByPlaceholderText('Value');
  annotationValueInputs[annotationValueInputs.length - 1].focus();
  await user.paste('an annotation value');

  const submitButton = await screen.findByRole('button', { name: 'Save alert' });
  await user.click(submitButton);
  await waitFor(() => {
    expect(setRules).toHaveBeenCalledTimes(1);
  });
  expect(setRules).toHaveBeenCalledWith([
    {
      expr: ALERT_PROBE_SUCCESS_RECORDING_EXPR,
      record: 'instance_job_severity:probe_success:mean5m',
    },
    {
      alert: 'A different name',
      annotations: {
        an_annotation_name: 'an annotation value',
        description:
          'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
        summary: 'check success below 95%',
      },
      expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="high"} < 25',
      for: '2s',
      labels: {
        a_label_name: 'a_label_value',
        namespace: 'synthetic_monitoring',
      },
    },
    {
      alert: 'SyntheticMonitoringCheckFailureAtMediumSensitivity',
      annotations: {
        description:
          'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
        summary: 'check success below 90%',
      },
      expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="medium"} < 90',
      for: '5m',
      labels: {
        namespace: 'synthetic_monitoring',
      },
    },
    {
      alert: 'SyntheticMonitoringCheckFailureAtLowSensitivity',
      annotations: {
        description:
          'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
        summary: 'check success below 75%',
      },
      expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="low"} < 75',
      for: '5m',
      labels: {
        namespace: 'synthetic_monitoring',
      },
    },
  ]);
});
