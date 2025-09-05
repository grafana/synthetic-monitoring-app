import React from 'react';

import { GRAFANA_DEV_ENTRY } from 'hooks/useProbeApiServer';

import { LinkedDatasourceView } from '../../../components/LinkedDatasourceView';
import { DataTestIds } from '../../../test/dataTestIds';
import { render } from '../../../test/render';
import { GeneralTab } from './GeneralTab';

jest.mock('../../../components/LinkedDatasourceView', () => {
  return {
    LinkedDatasourceView: jest.fn(() => <div>LinkedDatasourceView</div>),
  };
});

async function renderGeneralTab(metaOverrides?: any) {
  const result = render(<GeneralTab />, { meta: metaOverrides });
  await result.findByTestId(DataTestIds.CONFIG_CONTENT);

  return result;
}

describe('GeneralTab', () => {
  it('should render', async () => {
    const { container } = await renderGeneralTab();
    expect(container).toBeInTheDocument();
  });

  it('should render with title', async () => {
    const { getByText } = await renderGeneralTab();
    expect(getByText('General')).toBeInTheDocument();
  });

  it('should have a section on private probes', async () => {
    const { getByText, getByTestId } = await renderGeneralTab();
    expect(getByText('Private probes', { selector: 'h3' })).toBeInTheDocument();
    expect(getByText('Probe API Server URL')).toBeInTheDocument();
    expect(getByText('Your backend address is:')).toBeInTheDocument();

    expect(getByTestId(DataTestIds.PREFORMATTED)).toHaveTextContent(GRAFANA_DEV_ENTRY.apiServerURL);
    expect(getByText(GRAFANA_DEV_ENTRY.backendAddress)).toBeInTheDocument();
  });

  it('should have a section on data sources', async () => {
    const { getByText } = await renderGeneralTab();
    expect(getByText('Data sources', { selector: 'h3' })).toBeInTheDocument();
    expect(LinkedDatasourceView).toHaveBeenNthCalledWith(1, { type: 'synthetic-monitoring-datasource' }, {});
    expect(LinkedDatasourceView).toHaveBeenNthCalledWith(2, { type: 'prometheus' }, {});
    expect(LinkedDatasourceView).toHaveBeenNthCalledWith(3, { type: 'loki' }, {});
  });

  it('should show plugin version', async () => {
    const { getByText } = await renderGeneralTab();
    // version is collected from meta.info, hence '%VERSION%' when running inside test
    expect(getByText('%VERSION%', { exact: false })).toBeInTheDocument();
  });
});
