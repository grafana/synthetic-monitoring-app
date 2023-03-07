import React from 'react';
import { screen, render, within } from '@testing-library/react';
import HomePage from './HomePage';
import { InstanceContext } from 'contexts/InstanceContext';
import { CheckInfoContextProvider } from 'components/CheckInfoContextProvider';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';
import { GlobalSettings } from 'types';
import { AppPluginMeta } from '@grafana/data';

const renderHomePage = () => {
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance: { api: getInstanceMock(instanceSettings) }, loading: false, meta }}>
      <CheckInfoContextProvider>
        <HomePage />
      </CheckInfoContextProvider>
    </InstanceContext.Provider>
  );
};

const assertBigValue = async (label: string, value: string) => {
  const labelEl = await screen.findByText(label);
  const parent = labelEl.parentElement;
  if (!parent) {
    throw new Error(`Could not find label with text ${label}`);
  }
  const valueEl = await within(parent).findByText(value);
  expect(valueEl).toBeInTheDocument();
};

test('shows usage', async () => {
  renderHomePage();
  await assertBigValue('Total checks', '1');
  await assertBigValue('Total active series', '81');
  await assertBigValue('Checks executions per month', '43,800');
  await assertBigValue('Logs per month', '0.04GB');
});
