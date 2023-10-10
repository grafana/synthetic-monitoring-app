import React from 'react';
import userEvent from '@testing-library/user-event';
import { DataSourceSettings } from '@grafana/data';
import { screen, waitFor, within } from '@testing-library/react';

import { render } from 'test/render';
import { Alerting } from 'components/Alerting';
import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY,
} from 'components/constants';
import { AlertFamily, AlertRule, AlertSensitivity } from 'types';

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

// import * as useAlerts from 'hooks/useAlerts';

jest.setTimeout(30000);

const setDefaultRules = jest.fn();
const setRules = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));

const renderAlerting = async ({ withAlerting = true } = {}) => {
  return render(<Alerting />, {
    instance: {
      alertRuler: withAlerting ? ({ url: 'alertUrl' } as unknown as DataSourceSettings) : undefined,
    },
  });
};

// const mockAlertsHook = () => {};

const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

it('adds default alerts and edits alerts', async () => {
  // mockAlertsHook();
  await renderAlerting();
  const defaultAlertButton = await screen.findByRole('button', { name: 'Populate default alerts' });
  userEvent.click(defaultAlertButton);
  await waitFor(() => expect(defaultAlertButton).not.toBeDisabled());
  expect(setDefaultRules).toHaveBeenCalledTimes(1);

  const button = await screen.findByRole('button', {
    name: DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.High],
  });
  userEvent.click(button);

  const alertNameInput = await screen.findByLabelText('Alert name');
  expect(alertNameInput).toHaveValue(
    DEFAULT_ALERT_NAMES_BY_FAMILY_AND_SENSITIVITY[AlertFamily.ProbeSuccess][AlertSensitivity.High]
  );
  await userEvent.clear(alertNameInput);
  await userEvent.type(alertNameInput, 'A different name');

  const probePercentage = await screen.findByTestId('probePercentage');
  expect(probePercentage).toHaveValue(95);
  await userEvent.clear(probePercentage);
  await userEvent.type(probePercentage, '25');

  const timeCount = await screen.findByTestId('timeCount');
  expect(timeCount).toHaveValue(5);
  await userEvent.clear(timeCount);
  await userEvent.type(timeCount, '2');

  const timeUnit = await screen.findAllByTestId('select');
  userEvent.selectOptions(timeUnit[1], 's');

  const labels = await toggleSection('Labels');
  const addLabelButton = await within(labels).findByRole('button', { name: 'Add label' });
  userEvent.click(addLabelButton);
  const labelNameInputs = await within(labels).findAllByPlaceholderText('Name');
  await userEvent.type(labelNameInputs[labelNameInputs.length - 1], 'a_label_name');
  const labelValueInputs = await within(labels).findAllByPlaceholderText('Value');
  await userEvent.type(labelValueInputs[labelValueInputs.length - 1], 'a_label_value');

  const annotations = await toggleSection('Annotations');
  const addAnnotationsButton = await within(annotations).findByRole('button', { name: 'Add annotation' });
  userEvent.click(addAnnotationsButton);
  const annotationNameInputs = await within(annotations).findAllByPlaceholderText('Name');
  await userEvent.type(annotationNameInputs[annotationNameInputs.length - 1], 'an_annotation_name');
  const annotationValueInputs = await within(annotations).findAllByPlaceholderText('Value');
  userEvent.paste(annotationValueInputs[annotationValueInputs.length - 1], 'an annotation value');

  const submitButton = await screen.findByRole('button', { name: 'Save alert' });
  userEvent.click(submitButton);
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
