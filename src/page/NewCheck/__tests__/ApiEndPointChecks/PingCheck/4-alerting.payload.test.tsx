import { config } from '@grafana/runtime';
import { screen } from '@testing-library/react';

import { CheckType, FeatureName } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.PING;

describe(`PingCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);
    await submitForm(user);
    const { body } = await read();

    expect(body.alerts).toEqual(undefined);
  });

  it(`can add specific ping alerts`, async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 4);

    expect(screen.getByText('Predefined alerts')).toBeInTheDocument();

    expect(screen.getByText('Probe Failed Executions Too High')).toBeInTheDocument();
    expect(screen.queryByText('HTTP Request Duration Too High (P50)')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTP Request Duration Too High (P90)')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTP Request Duration Too High (P95)')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTP Request Duration Too High (P99)')).not.toBeInTheDocument();
    expect(screen.queryByText('HTTP Target Certificate Close To Expiring')).not.toBeInTheDocument();
    expect(screen.getByText('Ping ICMP Duration Too High (P50)')).toBeInTheDocument();
    expect(screen.getByText('Ping ICMP Duration Too High (P90)')).toBeInTheDocument();
    expect(screen.getByText('Ping ICMP Duration Too High (P95)')).toBeInTheDocument();
    expect(screen.getByText('Ping ICMP Duration Too High (P99)')).toBeInTheDocument();

    const thresholdsInputs = screen.getAllByLabelText(/^Threshold/);

    expect(thresholdsInputs).toHaveLength(5);

    await user.click(screen.getByLabelText('Probe Failed Executions Too High'));
    await user.clear(thresholdsInputs[0]);
    await user.type(thresholdsInputs[0], '0.1');

    await user.click(screen.getByLabelText('Ping ICMP Duration Too High (P50)'));
    await user.clear(thresholdsInputs[1]);
    await user.type(thresholdsInputs[1], '1');

    await user.click(screen.getByLabelText('Ping ICMP Duration Too High (P90)'));
    await user.clear(thresholdsInputs[2]);
    await user.type(thresholdsInputs[2], '2');

    await user.click(screen.getByLabelText('Ping ICMP Duration Too High (P95)'));
    await user.clear(thresholdsInputs[3]);
    await user.type(thresholdsInputs[3], '3');

    await submitForm(user);

    const { body: alertsBody } = await read(1);

    expect(alertsBody).toEqual({
      alerts: [
        {
          name: 'ProbeFailedExecutionsTooHigh',
          threshold: 0.1,
        },
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
