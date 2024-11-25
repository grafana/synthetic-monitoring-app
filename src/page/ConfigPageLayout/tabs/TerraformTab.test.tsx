import React from 'react';
import { within } from '@testing-library/react';

import { DataTestIds } from '../../../test/dataTestIds';
import { BASIC_PING_CHECK } from '../../../test/fixtures/checks';
import { PRIVATE_PROBE } from '../../../test/fixtures/probes';
import { TERRAFORM_BASIC_PING_CHECK } from '../../../test/fixtures/terraform';
import { apiRoute } from '../../../test/handlers';
import { render } from '../../../test/render';
import { server } from '../../../test/server';
import { TerraformTab } from './TerraformTab';

async function renderTerraformTab() {
  server.use(
    apiRoute('listChecks', {
      result: () => {
        return {
          json: [BASIC_PING_CHECK],
        };
      },
    })
  );

  const result = render(<TerraformTab />);
  await result.findByTestId(DataTestIds.CONFIG_CONTENT);

  return result;
}

describe('TerraformTab', () => {
  it('should render', async () => {
    const { container } = await renderTerraformTab();
    expect(container).toBeInTheDocument();
  });

  it('should show correct heading', async () => {
    const { getByText } = await renderTerraformTab();
    expect(getByText('Terraform config', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should show prerequisites', async () => {
    const { getByText } = await renderTerraformTab();
    expect(getByText('Prerequisites', { selector: 'h3' })).toBeInTheDocument();
    expect(getByText('Grafana API key', { selector: 'a' })).toBeInTheDocument();
    expect(getByText('Synthetic Monitoring access token', { selector: 'a' })).toBeInTheDocument();
  });

  it('should show "Terraform and JSON" <Alert severity="info" />', async () => {
    const { getByTestId } = await renderTerraformTab();
    // Terraform and JSON

    const alert = getByTestId('data-testid Alert info');
    expect(within(alert).getByText('Terraform and JSON')).toBeInTheDocument();
    expect(alert).toBeInTheDocument();
  });

  it('should show `tf.json` with replace vars', async () => {
    const { getByText } = await renderTerraformTab();
    expect(getByText('Exported config', { selector: 'h3' })).toBeInTheDocument();
    expect(getByText('GRAFANA_SERVICE_TOKEN', { selector: 'a > strong', exact: false })).toBeInTheDocument();
    expect(getByText('SM_ACCESS_TOKEN', { selector: 'a > strong', exact: false })).toBeInTheDocument();
  });

  it('should show correct terraform config', async () => {
    const { getAllByTestId } = await renderTerraformTab();
    const preformatted = getAllByTestId(DataTestIds.PREFORMATTED);
    // Since content escapes '<' and '>', we need to replace them back
    const content = JSON.parse((preformatted[0].textContent ?? '').replace('&lt;', '<').replace('&gt;', '>'));
    expect(content).toEqual(TERRAFORM_BASIC_PING_CHECK);
  });

  describe('import existing checks', () => {
    it('should show "Import existing checks"', async () => {
      const { getByText } = await renderTerraformTab();
      expect(getByText('Import existing checks into Terraform', { selector: 'h3' })).toBeInTheDocument();
    });

    it('should show correct check import commands', async () => {
      const { getByText, getAllByTestId } = await renderTerraformTab();
      expect(getByText('Import existing checks into Terraform', { selector: 'h3' })).toBeInTheDocument();
      const preformatted = getAllByTestId(DataTestIds.PREFORMATTED);
      expect(preformatted[1]).toHaveTextContent(
        'terraform import grafana_synthetic_monitoring_check.Job_name_for_ping_grafana_com 5'
      );
    });

    describe('import custom probes', () => {
      it('should show "Import custom probes"', async () => {
        const { getByText } = await renderTerraformTab();
        expect(getByText('Import custom probes into Terraform', { selector: 'h3' })).toBeInTheDocument();
      });

      it('should show replace vars for custom probes', async () => {
        const { getByText } = await renderTerraformTab();
        expect(getByText('PROBE_ACCESS_TOKEN', { selector: 'a > strong', exact: false })).toBeInTheDocument();
      });

      it('should show correct probe import commands', async () => {
        server.use(
          apiRoute(`listProbes`, {
            result: () => {
              return {
                json: [PRIVATE_PROBE],
              };
            },
          })
        );
        const { getAllByTestId } = await renderTerraformTab();
        const preformatted = getAllByTestId(DataTestIds.PREFORMATTED);
        expect(preformatted[2]).toHaveTextContent(
          'terraform import grafana_synthetic_monitoring_probe.tacos 1:<PROBE_ACCESS_TOKEN>'
        );
      });
    });
  });
});
