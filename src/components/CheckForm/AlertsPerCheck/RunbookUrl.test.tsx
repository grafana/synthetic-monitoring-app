import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { mockFeatureToggles } from 'test/utils';

import { CheckAlertType, FeatureName } from 'types';
import { goToSection, renderEditForm } from 'page/__testHelpers__/checkForm';

describe('RunbookUrl', () => {
  beforeEach(() => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });
  });

  it('renders the runbook URL inputs for pre-selected alerts', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    expect(screen.getByTestId(`alert-runbook-url-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`)).toBeInTheDocument();
    expect(screen.getByTestId(`alert-runbook-url-${CheckAlertType.ProbeFailedExecutionsTooHigh}`)).toBeInTheDocument();
    
    expect(screen.getAllByText('Runbook URL (optional):')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('https://example.com/runbook')).toHaveLength(2);
  });

  it('displays existing runbook URL values from test data', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section
    expect(screen.getByDisplayValue('https://example.com/runbooks/tls-certificate')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/runbooks/probe-failures')).toBeInTheDocument();
  });

  it('allows user to modify an existing runbook URL', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section
    const tlsRunbookInput = screen.getByTestId(`alert-runbook-url-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`);
    
    await user.clear(tlsRunbookInput);
    await user.type(tlsRunbookInput, 'https://mycompany.com/runbooks/modified-tls-cert');

    expect(tlsRunbookInput).toHaveValue('https://mycompany.com/runbooks/modified-tls-cert');
  });

  it('allows user to modify the failed executions runbook URL', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section
    const failedExecRunbookInput = screen.getByTestId(`alert-runbook-url-${CheckAlertType.ProbeFailedExecutionsTooHigh}`);
  
    await user.clear(failedExecRunbookInput);
    await user.type(failedExecRunbookInput, 'https://mycompany.com/runbooks/modified-failed-exec');

    expect(failedExecRunbookInput).toHaveValue('https://mycompany.com/runbooks/modified-failed-exec');
  });

  it('allows user to clear a runbook URL', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section
    const tlsRunbookInput = screen.getByTestId(`alert-runbook-url-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`);
    
    await user.clear(tlsRunbookInput);

    expect(tlsRunbookInput).toHaveValue('');
  });

  it('shows runbook URL input as disabled when alert is deselected', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5); // Go to alerts section

    expect(screen.getByTestId(`alert-runbook-url-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`)).toBeInTheDocument();
    const tlsCheckbox = screen.getByTestId(`checkbox-alert-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`);
    await user.click(tlsCheckbox);

    expect(screen.queryByTestId(`alert-runbook-url-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`)).toHaveAttribute('disabled');
  });
});
