import { screen, within } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { mockFeatureToggles, probeToMetadataProbe } from 'test/utils';

import { CheckAlertType, CheckType, FeatureName } from 'types';
import { goToSection, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);
    await submitForm(user);
    const { body } = await read();

    expect(body.alerts).toEqual(undefined);
  });

  it(`can add specific http alerts`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    expect(screen.getByText(`Alert if the target's certificate expires in less than`)).toBeInTheDocument();

    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].selectedCheckbox
      )
    );

    const thresholdsInputSelector =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].thresholdInput;
    await user.clear(screen.getByTestId(thresholdsInputSelector));
    await user.type(screen.getByTestId(thresholdsInputSelector), '1');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'TLSTargetCertificateCloseToExpiring',
          threshold: 1,
        },
      ],
    });
  });

  it(`can add HTTP request duration latency alert`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    // Check that latency alerts section exists
    expect(screen.getByText('Latency')).toBeInTheDocument();

    const thresholdInputSelector =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].thresholdInput;

    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].selectedCheckbox
      )
    );
    await user.clear(screen.getByTestId(thresholdInputSelector));
    await user.type(screen.getByTestId(thresholdInputSelector), '500');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'HTTPRequestDurationTooHighAvg',
          threshold: 500,
          period: '5m',
        },
      ],
    });
  });

  it(`should display an error message when the threshold is higher than the total amount of executions`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });
    const { user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();
    expect(screen.getByText(`Failed Checks`)).toBeInTheDocument();

    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].selectedCheckbox
      )
    );
    await user.clear(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].thresholdInput
      )
    );

    await user.type(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].thresholdInput
      ),
      '50'
    );

    await submitForm(user);

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(
      'Threshold (50) must be lower than or equal to the total number of checks per period (5)'
    );
  });

  it(`can submit runbook URL values to the alerts API endpoint`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    // Enable TLS Certificate alert and set threshold
    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].selectedCheckbox
      )
    );

    const tlsThresholdsInputSelector =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].thresholdInput;
    await user.clear(screen.getByTestId(tlsThresholdsInputSelector));
    await user.type(screen.getByTestId(tlsThresholdsInputSelector), '7');

    // Fill in runbook URL
    const runbookUrlInput = screen.getByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].runbookUrlInput
    );
    await user.type(runbookUrlInput, 'https://example.com/runbooks/tls-cert-expiry');

    // Enable Failed Executions alert and set threshold and period
    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].selectedCheckbox
      )
    );

    const failedExecutionsThresholdsInputSelector =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].thresholdInput;
    await user.clear(screen.getByTestId(failedExecutionsThresholdsInputSelector));
    await user.type(screen.getByTestId(failedExecutionsThresholdsInputSelector), '3');

    // Fill in runbook URL for Failed Executions alert
    const failedExecRunbookUrlInput = screen.getByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].runbookUrlInput
    );
    await user.type(failedExecRunbookUrlInput, 'https://example.com/runbooks/failed-executions');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'ProbeFailedExecutionsTooHigh',
          period: '5m',
          runbookUrl: 'https://example.com/runbooks/failed-executions',
          threshold: 3,
        },
        {
          name: 'TLSTargetCertificateCloseToExpiring',
          runbookUrl: 'https://example.com/runbooks/tls-cert-expiry',
          threshold: 7,
        },
      ],
    });
  });

  it(`should display an error message when latency alert period is less than check frequency`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });
    const { user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });

    // Set frequency to 10 minutes using the proper helper - go to section 4 (Execution)
    await goToSection(user, 4);
    await selectBasicFrequency(user, '10m');

    // Still in section 4 for probes selection
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    // Now go to section 5 for alerts
    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].selectedCheckbox
      )
    );

    const httpRequestDurationThresholdsInput =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].thresholdInput;
    await user.clear(screen.getByTestId(httpRequestDurationThresholdsInput));
    await user.type(screen.getByTestId(httpRequestDurationThresholdsInput), '100');

    // Select 5m period (which is less than 10m frequency) - target the specific period selector by ID
    const periodContainer = document.getElementById('alert-period-HTTPRequestDurationTooHighAvg');
    const periodSelector = within(periodContainer as HTMLElement).getByTestId(
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.HTTPRequestDurationTooHighAvg].periodCombobox
    );
    await user.click(periodSelector);

    // Wait for dropdown to open and click "5 min" within the opened dropdown
    const dropdown = await screen.findByRole('listbox');
    await user.click(within(dropdown).getByText('5 min'));

    await submitForm(user);

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent('Period (5m) must be equal or higher to the frequency (10 minutes)');
  });
});
