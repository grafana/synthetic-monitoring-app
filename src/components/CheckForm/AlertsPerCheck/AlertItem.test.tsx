import { screen } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { FormSectionName } from '../../Checkster/types';
import { CheckAlertType } from 'types';
import { renderEditForm } from 'page/__testHelpers__/checkForm';

import { gotoSection } from '../../Checkster/__testHelpers__/formHelpers';

describe('AlertItem', () => {
  it('shows NotOkStatusInfo when status is not OK and error is present for an existing alert', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);

    const alertStatus = await screen.findByTestId(
      `alert-error-status-${CheckAlertType.TLSTargetCertificateCloseToExpiring}`
    );
    expect(alertStatus).toBeInTheDocument();
  });

  it('Does not show NotOkStatusInfo when status is OK', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);

    const alertStatus = await screen.queryByTestId(`alert-error-status-${CheckAlertType.ProbeFailedExecutionsTooHigh}`);
    expect(alertStatus).not.toBeInTheDocument();
  });

  it('shows latency alerts for HTTP checks', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);

    const httpLatencyAlert = await screen.findByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].selectedCheckbox
    );
    expect(httpLatencyAlert).toBeInTheDocument();

    const thresholdInput = await screen.findByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].thresholdInput
    );
    expect(thresholdInput).toBeInTheDocument();
  });

  it('hides latency controls when deselected and restores the entered threshold when reselected', async () => {
    const { user } = await renderEditForm(BASIC_HTTP_CHECK.id);
    await gotoSection(user, FormSectionName.Alerting);

    const alertCheckbox = await screen.findByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].selectedCheckbox
    );
    const thresholdInput = await screen.findByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].thresholdInput
    );

    expect(alertCheckbox).toBeChecked();
    expect(thresholdInput).toBeEnabled();
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '450');

    await user.click(alertCheckbox);
    expect(thresholdInput).not.toBeInTheDocument();
    expect(alertCheckbox).toHaveAccessibleDescription(
      'Alert when average HTTP request duration exceeds your threshold.'
    );

    await user.click(alertCheckbox);
    expect(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].thresholdInput
      )
    ).toHaveValue(450);
  });
});
