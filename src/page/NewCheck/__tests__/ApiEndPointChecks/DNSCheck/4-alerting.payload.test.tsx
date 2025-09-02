import { screen, within } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { mockFeatureToggles, probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { FormSectionIndex } from 'components/CheckForm/constants';
import { goToSectionV2, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormSectionIndex.Alerting);
    await submitForm(user);
    const { body } = await read();

    expect(body.alerts).toEqual(undefined);
  });

  it(`can add DNS request duration latency alert`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSectionV2(user, FormSectionIndex.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSectionV2(user, FormSectionIndex.Alerting);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    // Check that latency alerts section exists
    expect(screen.getByText('Latency')).toBeInTheDocument();

    const thresholdInputSelector = 'alert-threshold-DNSRequestDurationTooHighAvg';

    await user.click(screen.getByTestId('checkbox-alert-DNSRequestDurationTooHighAvg'));
    await user.clear(screen.getByTestId(thresholdInputSelector));
    await user.type(screen.getByTestId(thresholdInputSelector), '150');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'DNSRequestDurationTooHighAvg',
          threshold: 150,
          period: '5m',
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
    await goToSectionV2(user, FormSectionIndex.Execution);
    await selectBasicFrequency(user, '10m');

    // Then go to section 4 for probes selection (this is the Execution section)
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    // Now go to section 5 for alerts
    await goToSectionV2(user, FormSectionIndex.Alerting);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    await user.click(screen.getByTestId('checkbox-alert-DNSRequestDurationTooHighAvg'));
    await user.clear(screen.getByTestId('alert-threshold-DNSRequestDurationTooHighAvg'));
    await user.type(screen.getByTestId('alert-threshold-DNSRequestDurationTooHighAvg'), '100');

    // Select 5m period (which is less than 10m frequency) - target the specific period selector by ID
    const periodContainer = document.getElementById('alert-period-DNSRequestDurationTooHighAvg');
    const periodSelector = within(periodContainer as HTMLElement).getByTestId('alertPendingPeriod');
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
