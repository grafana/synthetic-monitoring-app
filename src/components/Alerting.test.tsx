import { Alerting } from 'components/Alerting';
import { ALERT_RECORDING_EXPR, DEFAULT_ALERT_NAMES_BY_SENSITIVITY } from 'components/constants';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { AppPluginMeta, DataSourceSettings } from '@grafana/data';
import { AlertRule, AlertSensitivity, GlobalSettings } from 'types';
import * as useAlerts from 'hooks/useAlerts';

jest.setTimeout(30000);

const setDefaultRules = jest.fn();
const setRules = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));

const renderAlerting = async ({ withAlerting = true } = {}) => {
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: withAlerting ? (({ url: 'alertUrl' } as unknown) as DataSourceSettings) : undefined,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <Alerting />
    </InstanceContext.Provider>
  );
};

const mockAlertsHook = () => {
  jest
    .spyOn(useAlerts, 'useAlerts')
    .mockImplementationOnce(() => ({
      alertRules: [],
      alertError: '',
      setDefaultRules,
      setRules,
    }))
    .mockImplementation(() => ({
      alertRules: useAlerts.defaultRules.rules as AlertRule[],
      alertError: '',
      setDefaultRules,
      setRules,
    }));
};

const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

it('adds default alerts and edits alerts', async () => {
  mockAlertsHook();
  await renderAlerting();
  const defaultAlertButton = await screen.findByRole('button', { name: 'Populate default alerts' });
  userEvent.click(defaultAlertButton);
  await waitFor(() => expect(defaultAlertButton).not.toBeDisabled());
  expect(setDefaultRules).toHaveBeenCalledTimes(1);

  const button = await screen.findByRole('button', { name: DEFAULT_ALERT_NAMES_BY_SENSITIVITY[AlertSensitivity.High] });
  userEvent.click(button);

  const alertNameInput = await screen.findByLabelText('Alert name');
  expect(alertNameInput).toHaveValue(DEFAULT_ALERT_NAMES_BY_SENSITIVITY[AlertSensitivity.High]);
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
      expr: ALERT_RECORDING_EXPR,
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
