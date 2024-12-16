import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.PING;

describe(`HttpCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);
    await submitForm(user);
    const { body } = await read(1);

    expect(body.alerts).toEqual([]);
  });

  it(`can add specific ping alerts`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Predefined alerts')).toBeInTheDocument();

    expect(screen.getByText('ProbeFailedExecutionsTooHigh')).toBeInTheDocument();
    expect(screen.queryByText('HTTPRequestDurationTooHighP50')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTPRequestDurationTooHighP90')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTPRequestDurationTooHighP95')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTPRequestDurationTooHighP99')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTPTargetCertificateCloseToExpiring')).not.toBeInTheDocument();
    expect(screen.getByText('PingICMPDurationTooHighP50')).toBeInTheDocument();
    expect(screen.getByText('PingICMPDurationTooHighP90')).toBeInTheDocument();
    expect(screen.getByText('PingICMPDurationTooHighP95')).toBeInTheDocument();
    expect(screen.getByText('PingICMPDurationTooHighP99')).toBeInTheDocument();

    const thresholdsInputs = screen.getAllByLabelText(/^Threshold/);

    expect(thresholdsInputs).toHaveLength(5);

    await user.clear(thresholdsInputs[0]);
    await user.type(thresholdsInputs[0], '0.1');

    await user.clear(thresholdsInputs[1]);
    await user.type(thresholdsInputs[1], '1');

    await user.clear(thresholdsInputs[2]);
    await user.type(thresholdsInputs[2], '2');

    await user.clear(thresholdsInputs[3]);
    await user.type(thresholdsInputs[3], '3');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        { name: 'ProbeFailedExecutionsTooHigh', threshold: 0.1 },
        {
          name: 'PingICMPDurationTooHighP50',
          threshold: 1,
        },
        {
          name: 'PingICMPDurationTooHighP90',
          threshold: 2,
        },
        {
          name: 'PingICMPDurationTooHighP95',
          threshold: 3,
        },
      ],
    });
  });
});
