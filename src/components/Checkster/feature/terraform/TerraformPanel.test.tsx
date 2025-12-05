import { screen, waitFor } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckType } from 'types';
import { renderEditFormV2, renderNewFormV2 } from 'page/__testHelpers__/checkForm';

describe('TerraformPanel', () => {
  describe('Tab visibility', () => {
    it.each([
      CheckType.HTTP,
      CheckType.DNS,
      CheckType.PING,
      CheckType.TCP,
      CheckType.GRPC,
      CheckType.Traceroute,
      CheckType.MULTI_HTTP,
      CheckType.Scripted,
      CheckType.Browser,
    ])('should render the Terraform tab for %s checks', async (checkType) => {
      await renderNewFormV2(checkType);

      const tab = await screen.findByText('Terraform');
      expect(tab).toBeInTheDocument();
    });
  });

  describe('Panel content', () => {
    it('should display the Terraform panel when the tab is clicked', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const panel = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.root);
      expect(panel).toBeInTheDocument();
    });

    it('should display HCL format by default', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const hclTab = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.tab('hcl'));
      expect(hclTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to JSON format when JSON tab is clicked', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const terraformTab = await screen.findByText('Terraform');
      await user.click(terraformTab);

      const jsonTab = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.tab('json'));
      await user.click(jsonTab);

      expect(jsonTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should display code content', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);
      expect(codeContent).toBeInTheDocument();
    });

    it('should have a copy button', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const copyButton = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Configuration generation', () => {
    it('should include check resource block in HCL output', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);

      await waitFor(() => {
        expect(codeContent.textContent).toContain('resource');
        expect(codeContent.textContent).toContain('grafana_synthetic_monitoring_check');
      });
    });

    it('should include check settings in HCL output', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const tab = await screen.findByText('Terraform');
      await user.click(tab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);

      await waitFor(() => {
        expect(codeContent.textContent).toContain('settings');
        expect(codeContent.textContent).toContain('http');
      });
    });

    it('should display valid JSON when JSON format is selected', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);

      const terraformTab = await screen.findByText('Terraform');
      await user.click(terraformTab);

      const jsonTab = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.tab('json'));
      await user.click(jsonTab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);

      await waitFor(() => {
        const jsonContent = codeContent.textContent || '';
        expect(jsonContent).toContain('{');
        expect(jsonContent).toContain('"job"');
        expect(jsonContent).toContain('"target"');
        expect(jsonContent).toContain('"settings"');
      });
    });

    it('should not include alerts resource for new checks without ID', async () => {
      const { user } = await renderNewFormV2(CheckType.HTTP);
      const terraformTab = await screen.findByText('Terraform');
      await user.click(terraformTab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);

      await waitFor(() => {
        expect(codeContent.textContent).not.toContain('grafana_synthetic_monitoring_check_alerts');
      });
    });

    it('should include alerts resource for existing checks with alerts', async () => {
      const { user } = await renderEditFormV2(BASIC_HTTP_CHECK.id);

      const terraformTab = await screen.findByText('Terraform');
      await user.click(terraformTab);

      const codeContent = await screen.findByTestId(CHECKSTER_TEST_ID.feature.terraform.codeContent);

      await waitFor(() => {
        expect(codeContent.textContent).toContain('grafana_synthetic_monitoring_check_alerts');
        expect(codeContent.textContent).toContain(`check_id = "${BASIC_HTTP_CHECK.id}"`);
      });
    });
  });
});
