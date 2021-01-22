import { Alerting } from 'components/Alerting';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from './InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { AppPluginMeta, DataSourceInstanceSettings } from '@grafana/data';
import { AlertSensitivity, GlobalSettings } from 'types';
import * as useAlerts from 'hooks/useAlerts';

jest.setTimeout(30000);

const setDefaultRules = jest.fn();
const setRules = jest.fn().mockImplementation(() => Promise.resolve({ ok: true }));
const deleteRulesForCheck = jest.fn();

const renderAlerting = async ({ withAlerting = true } = {}) => {
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: withAlerting ? ({ url: 'alertUrl' } as DataSourceInstanceSettings) : undefined,
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
      setDefaultRules,
      setRules,
      deleteRulesForCheck,
    }))
    .mockImplementation(() => ({
      alertRules: [
        {
          alert: 'High Sensitivity',
          expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.High}"} < 0.95`,
          for: '5m',
        },
        {
          alert: 'Medium Sensitivity',
          expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.Medium}"} < 0.8`,
          for: '5m',
        },
        {
          alert: 'Low Sensitivity',
          expr: `probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="${AlertSensitivity.Low}"} < 0.75`,
          for: '5m',
        },
      ],
      setDefaultRules,
      setRules,
      deleteRulesForCheck,
    }));
};

const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

const toggleSubsection = async (parentSection: HTMLElement, sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await within(parentSection).findByText(sectionName);
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

  const highSensitivity = await toggleSection('High Sensitivity');

  const alertNameInput = await within(highSensitivity).findByLabelText('Alert name');
  expect(alertNameInput).toHaveValue('High Sensitivity');
  await userEvent.clear(alertNameInput);
  await userEvent.type(alertNameInput, 'A different name');

  const probePercentage = await within(highSensitivity).findByTestId('probePercentage');
  expect(probePercentage).toHaveValue(95);
  await userEvent.clear(probePercentage);
  await userEvent.type(probePercentage, '25');

  const timeCount = await within(highSensitivity).findByTestId('timeCount');
  expect(timeCount).toHaveValue(5);
  await userEvent.clear(timeCount);
  await userEvent.type(timeCount, '2');

  const timeUnit = await within(highSensitivity).findByText('minutes');
  userEvent.click(timeUnit);
  const option = await within(highSensitivity).findByText('seconds');
  userEvent.click(option);

  const labels = await toggleSubsection(highSensitivity, 'Labels');
  const addLabelButton = await within(labels).findByRole('button', { name: 'Add label' });
  userEvent.click(addLabelButton);
  const labelNameInput = await within(labels).findByPlaceholderText('Name');
  await userEvent.type(labelNameInput, 'a label name');
  const labelValueInput = await within(labels).findByPlaceholderText('Value');
  await userEvent.type(labelValueInput, 'a label value');

  const annotations = await toggleSubsection(highSensitivity, 'Annotations');
  const addAnnotationsButton = await within(annotations).findByRole('button', { name: 'Add annotation' });
  userEvent.click(addAnnotationsButton);
  const annotationNameInput = await within(annotations).findByPlaceholderText('Name');
  await userEvent.type(annotationNameInput, 'an annotation name');
  const annotationValueInput = await within(annotations).findByPlaceholderText('Value');
  userEvent.paste(annotationValueInput, 'an annotation value');

  const submitButton = await within(highSensitivity).findByRole('button', { name: 'Save alert' });
  userEvent.click(submitButton);
  await waitFor(() => {
    expect(setRules).toHaveBeenCalledTimes(1);
  });
  expect(setRules).toHaveBeenCalledWith([
    {
      alert: 'A different name',
      annotations: { 'an annotation name': 'an annotation value' },
      expr:
        'probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="high"} < 0.25',
      for: '2s',
      labels: { 'a label name': 'a label value' },
    },
    {
      alert: 'Medium Sensitivity',
      expr:
        'probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="medium"} < 0.8',
      for: '5m',
    },
    {
      alert: 'Low Sensitivity',
      expr:
        'probe_success * on (instance, job, probe, config_version) group_left (check_name) sm_check_info{alert_sensitivity="low"} < 0.75',
      for: '5m',
    },
  ]);

  // const labels = await screenfind;
});
