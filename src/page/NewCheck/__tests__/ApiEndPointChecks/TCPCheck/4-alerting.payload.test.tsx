import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 4 (Alerting) payload`, () => {
  it(`can add TLS certificate expiry alert when TLS is enabled`, async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 1);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));
    await user.click(screen.getByLabelText('Use TLS', { exact: false }));
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();
    expect(screen.getByText(`Alert if the target's certificate expires in less than`)).toBeInTheDocument();

    const thresholdsInputSelector = 'alert-threshold-TLSTargetCertificateCloseToExpiring';
    await user.click(screen.getByTestId('checkbox-alert-TLSTargetCertificateCloseToExpiring'));
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

  it(`disables TLS expiry alert and shows warning if TLS is not enabled`, async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSection(user, 2);
    // Do NOT enable TLS
    await goToSection(user, 4);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await goToSection(user, 5);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();
    const tlsCheckbox = screen.getByTestId('checkbox-alert-TLSTargetCertificateCloseToExpiring');
    expect(tlsCheckbox).toBeDisabled();
    expect(
      screen.getByText(
        /TLS must be enabled in Request options in order to collect the required TLS metrics for this alert/i
      )
    ).toBeInTheDocument();
  });
}); 
