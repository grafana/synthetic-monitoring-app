import React from 'react';

import { LinkedDatasourceView } from '../../../components/LinkedDatasourceView';
import { DataTestIds } from '../../../test/dataTestIds';
import { SM_DATASOURCE } from '../../../test/fixtures/datasources';
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
    expect(getByText('Private probes', { selector: 'h4' })).toBeInTheDocument();
    expect(getByText('Backend address', { selector: 'h5' })).toBeInTheDocument();

    const expectedBackendAddress = SM_DATASOURCE.jsonData.apiHost.replace('https://', '');
    expect(getByTestId(DataTestIds.PREFORMATTED)).toHaveTextContent(expectedBackendAddress);
  });

  it('should have a section on data sources', async () => {
    const { getByText } = await renderGeneralTab();
    expect(getByText('Data Sources', { selector: 'h3' })).toBeInTheDocument();
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
