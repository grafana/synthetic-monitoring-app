import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { PUBLIC_PROBE } from 'test/fixtures/probes';
import { probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

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
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    expect(screen.getByText(`Alert if the target's certificate expires in less than`)).toBeInTheDocument();

    const thresholdsInput = screen.getByTestId('alert-threshold-HTTPTargetCertificateCloseToExpiring');

    await user.click(screen.getByTestId('checkbox-alert-HTTPTargetCertificateCloseToExpiring'));
    await user.clear(thresholdsInput);
    await user.type(thresholdsInput, '1');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'HTTPTargetCertificateCloseToExpiring',
          threshold: 1,
        },
      ],
    });
  });

  it(`should display an error message when the threhsold is higher than the total amount of executions`, async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.AlertsPerCheck]: true,
    });
    const { user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    expect(screen.getByText(`Failed Checks`)).toBeInTheDocument();

    const thresholdsInput = screen.getByTestId('alert-threshold-ProbeFailedExecutionsTooHigh');

    await user.click(screen.getByTestId('checkbox-alert-ProbeFailedExecutionsTooHigh'));
    await user.clear(thresholdsInput);
    await user.type(thresholdsInput, '50');

    await goToSection(user, 5);

    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PUBLIC_PROBE).displayName);
    await user.click(probeCheckbox);

    await submitForm(user);

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(
      'Threshold (50) must be lower than or equal to the total number of checks per period (10)'
    );
  });
});
