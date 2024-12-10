import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);
    await submitForm(user);
    const { body } = await read(1);

    expect(body.alerts).toEqual([]);
  });

  it(`can add specific http alerts`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Predefined alerts')).toBeInTheDocument();

    expect(screen.getByText('ProbeFailedExecutionsTooHigh')).toBeInTheDocument();
    expect(screen.getByText('HTTPRequestDurationTooHigh')).toBeInTheDocument();
    expect(screen.getByText('HTTPTargetCertificateCloseToExpiring')).toBeInTheDocument();
    expect(screen.queryByText('PingICMPDurationTooHigh')).not.toBeInTheDocument();

    const thresholdsInputs = screen.getAllByLabelText(`Threshold`);

    expect(thresholdsInputs).toHaveLength(3);

    const thresholdsInputProbeFailedAlert = screen.getAllByLabelText(`Threshold`)[0];

    await user.clear(thresholdsInputProbeFailedAlert);
    await user.type(thresholdsInputProbeFailedAlert, '0.1');

    const thresholdsInputHTTPAlert = screen.getAllByLabelText(`Threshold`)[2];

    await user.clear(thresholdsInputHTTPAlert);
    await user.type(thresholdsInputHTTPAlert, '5');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        { name: 'ProbeFailedExecutionsTooHigh', threshold: 0.1 },
        {
          name: 'HTTPTargetCertificateCloseToExpiring',
          threshold: 5,
        },
      ],
    });
  });
});
