import { screen } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { mockFeatureToggles, probeToMetadataProbe } from 'test/utils';

import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckAlertType, CheckType, FeatureName } from 'types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { gotoSection, submitForm } from '../../../../../../components/Checkster/__testHelpers__/formHelpers';
import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 4 (Alerting) payload`, () => {
  it(`can add TLS certificate expiry alert when TLS is enabled`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await gotoSection(user, FormSectionName.Check); // Redundant?
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS'));
    await user.click(screen.getByLabelText('Use TLS', { exact: false }));
    await gotoSection(user, FormSectionName.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await gotoSection(user, FormSectionName.Alerting);

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

  it(`disables TLS expiry alert and shows warning if TLS is not enabled`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await gotoSection(user, FormSectionName.Uptime);
    // Do NOT enable TLS
    await gotoSection(user, FormSectionName.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
    await gotoSection(user, FormSectionName.Alerting);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();
    await user.click(
      screen.getByTestId(
        CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.TLSTargetCertificateCloseToExpiring].selectedCheckbox
      )
    );
    await submitForm(user);

    expect(
      screen.getByText(
        /TLS must be enabled in Request options in order to collect the required TLS metrics for this alert/i
      )
    ).toBeInTheDocument();
  });
});
