import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { mockFeatureToggles } from 'test/utils';

import { CheckAlertType, FeatureName } from 'types';
import { goToSectionV2, renderEditForm } from 'page/__testHelpers__/checkForm';

import { FormSectionIndex } from '../constants';

describe('AlertItem', () => {
  beforeEach(() => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });
  });

  it('shows NotOkStatusInfo when status is not OK and error is present for an existing alert', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSectionV2(user, FormSectionIndex.Alerting);

    const alertStatus = await screen.findByTestId(
      `alert-error-status-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`
    );
    expect(alertStatus).toBeInTheDocument();
  });

  it('Does not show NotOkStatusInfo when status is OK', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSectionV2(user, FormSectionIndex.Alerting);

    const alertStatus = await screen.queryByTestId(`alert-error-status-${CheckAlertType.ProbeFailedExecutionsTooHigh}`);
    expect(alertStatus).not.toBeInTheDocument();
  });

  it('shows latency alerts for HTTP checks', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSectionV2(user, FormSectionIndex.Alerting);

    const httpLatencyAlert = await screen.findByTestId(
      `checkbox-alert-${CheckAlertType.HTTPRequestDurationTooHighAvg}`
    );
    expect(httpLatencyAlert).toBeInTheDocument();

    const thresholdInput = await screen.findByTestId(`alert-threshold-${CheckAlertType.HTTPRequestDurationTooHighAvg}`);
    expect(thresholdInput).toBeInTheDocument();
  });

  it('enables threshold and period inputs when latency alert is selected', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await goToSectionV2(user, FormSectionIndex.Alerting);

    const alertCheckbox = await screen.findByTestId(`checkbox-alert-${CheckAlertType.HTTPRequestDurationTooHighAvg}`);
    const thresholdInput = await screen.findByTestId(`alert-threshold-${CheckAlertType.HTTPRequestDurationTooHighAvg}`);

    expect(alertCheckbox).toBeChecked();
    expect(thresholdInput).toBeEnabled();

    await user.click(alertCheckbox);
    expect(thresholdInput).toBeDisabled();

    await user.click(alertCheckbox);
    expect(thresholdInput).toBeEnabled();
  });
});
