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

    expect(screen.getByText('Probe Failed Executions Too High')).toBeInTheDocument();
    expect(screen.getByText('HTTP Request Duration Too High (P50)')).toBeInTheDocument();
    expect(screen.getByText('HTTP Request Duration Too High (P90)')).toBeInTheDocument();
    expect(screen.getByText('HTTP Request Duration Too High (P95)')).toBeInTheDocument();
    expect(screen.getByText('HTTP Request Duration Too High (P99)')).toBeInTheDocument();
    expect(screen.getByText('HTTP Target Certificate Close To Expiring')).toBeInTheDocument();
    expect(screen.queryByText('Ping ICMP Duration Too High (P50)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ping ICMP Duration Too High (P90)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ping ICMP Duration Too High (P95)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ping ICMP Duration Too High (P99)')).not.toBeInTheDocument();

    const thresholdsInputs = screen.getAllByLabelText(/^Threshold/);

    expect(thresholdsInputs).toHaveLength(6);

    await user.click(screen.getByLabelText('Probe Failed Executions Too High'));
    await user.clear(thresholdsInputs[0]);
    await user.type(thresholdsInputs[0], '0.1');

    await user.click(screen.getByLabelText('HTTP Target Certificate Close To Expiring'));
    await user.clear(thresholdsInputs[1]);
    await user.type(thresholdsInputs[1], '1');

    await user.click(screen.getByLabelText('HTTP Request Duration Too High (P50)'));
    await user.clear(thresholdsInputs[2]);
    await user.type(thresholdsInputs[2], '2');

    await user.click(screen.getByLabelText('HTTP Request Duration Too High (P90)'));
    await user.clear(thresholdsInputs[3]);
    await user.type(thresholdsInputs[3], '3');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        { name: 'ProbeFailedExecutionsTooHigh', threshold: 0.1 },
        {
          name: 'HTTPRequestDurationTooHighP50',
          threshold: 2,
        },
        {
          name: 'HTTPRequestDurationTooHighP90',
          threshold: 3,
        },
        {
          name: 'HTTPTargetCertificateCloseToExpiring',
          threshold: 1,
        },
      ],
    });
  });
});
