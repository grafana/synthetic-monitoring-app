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

  it.only(`can add specific http alerts`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Predefined alerts')).toBeInTheDocument();

    expect(screen.getByText('ProbeFailedExecutionsTooHigh')).toBeInTheDocument();
    expect(screen.getByText('HTTPRequestDurationTooHighP50')).toBeInTheDocument();
    expect(screen.getByText('HTTPRequestDurationTooHighP90')).toBeInTheDocument();
    expect(screen.getByText('HTTPRequestDurationTooHighP95')).toBeInTheDocument();
    expect(screen.getByText('HTTPRequestDurationTooHighP99')).toBeInTheDocument();
    expect(screen.getByText('HTTPTargetCertificateCloseToExpiring')).toBeInTheDocument();
    expect(screen.queryByText('PingICMPDurationTooHighP50')).not.toBeInTheDocument();
    expect(screen.queryByText('PingICMPDurationTooHighP90')).not.toBeInTheDocument();
    expect(screen.queryByText('PingICMPDurationTooHighP95')).not.toBeInTheDocument();
    expect(screen.queryByText('PingICMPDurationTooHighP99')).not.toBeInTheDocument();

    const thresholdsInputs = screen.getAllByLabelText(/^Threshold/);

    expect(thresholdsInputs).toHaveLength(6);

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
          name: 'HTTPRequestDurationTooHighP50',
          threshold: 1,
        },
        {
          name: 'HTTPRequestDurationTooHighP90',
          threshold: 2,
        },
        {
          name: 'HTTPRequestDurationTooHighP95',
          threshold: 3,
        },
      ],
    });
  });
});
