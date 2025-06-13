import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { mockFeatureToggles } from 'test/utils';

import { CheckAlertType, FeatureName } from 'types';
import { goToSection, renderEditForm } from 'page/__testHelpers__/checkForm';

describe('AlertItem', () => {
  beforeEach(() => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });
  });

  it('shows NotOkStatusInfo when status is not OK and error is present for an existing alert', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5);

    const alertStatus = await screen.findByTestId(
      `alert-error-status-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`
    );
    expect(alertStatus).toBeInTheDocument();
  });

  it('Does not show NotOkStatusInfo when status is OK', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSection(user, 5);

    const alertStatus = await screen.queryByTestId(`alert-error-status-${CheckAlertType.ProbeFailedExecutionsTooHigh}`);
    expect(alertStatus).not.toBeInTheDocument();
  });
});
