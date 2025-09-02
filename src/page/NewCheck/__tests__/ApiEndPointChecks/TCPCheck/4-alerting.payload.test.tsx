import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { mockFeatureToggles, probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormSectionIndex } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 4 (Alerting) payload`, () => {
  it(`can add TLS certificate expiry alert when TLS is enabled`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSectionV2(user, FormSectionIndex.Check);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));
    await user.click(screen.getByLabelText('Use TLS', { exact: false }));
    await goToSectionV2(user, FormSectionIndex.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await goToSectionV2(user, FormSectionIndex.Alerting);

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
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSectionV2(user, FormSectionIndex.Uptime);
    // Do NOT enable TLS
    await goToSectionV2(user, FormSectionIndex.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await goToSectionV2(user, FormSectionIndex.Alerting);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();
    await user.click(screen.getByTestId('checkbox-alert-TLSTargetCertificateCloseToExpiring'));
    await submitForm(user);

    expect(
      screen.getByText(
        /TLS must be enabled in Request options in order to collect the required TLS metrics for this alert/i
      )
    ).toBeInTheDocument();
  });
});
