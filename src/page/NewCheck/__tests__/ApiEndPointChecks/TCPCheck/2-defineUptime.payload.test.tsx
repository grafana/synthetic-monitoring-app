import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { toBase64 } from 'utils';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THREE_SECONDS_IN_MS = 3 * 1000;
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.timeout).toBe(THREE_SECONDS_IN_MS);
  });

  it(`can set query/response`, async () => {
    const EXPECTED_RESPONSE_1 = 'response1';
    const DATA_SEND_1 = 'data1';

    const EXPECTED_RESPONSE_2 = 'response2';
    const DATA_SEND_2 = 'data2';

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormStepOrder.Uptime);
    const addQueryResponseButton = screen.getByText(`Add query/response`);
    await user.click(addQueryResponseButton);
    await user.click(addQueryResponseButton);

    await user.type(screen.getByLabelText('Response to expect 1'), EXPECTED_RESPONSE_1);
    await user.type(screen.getByLabelText('Data to send 1'), DATA_SEND_1);
    await user.click(screen.getByLabelText('Start TLS switch 1'));

    await user.type(screen.getByLabelText('Response to expect 2'), EXPECTED_RESPONSE_2);
    await user.type(screen.getByLabelText('Data to send 2'), DATA_SEND_2);

    await submitForm(user);
    const { body } = await read();

    expect(body.settings.tcp.queryResponse).toEqual([
      {
        expect: toBase64(EXPECTED_RESPONSE_1),
        send: toBase64(DATA_SEND_1),
        startTLS: true,
      },
      {
        expect: toBase64(EXPECTED_RESPONSE_2),
        send: toBase64(DATA_SEND_2),
        startTLS: false,
      },
    ]);
  });

  it(`can set the timeout`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormStepOrder.Uptime);

    const minutesInput = screen.getByLabelText('timeout minutes input');
    const secondsInput = screen.getByLabelText('timeout seconds input');
    await user.type(minutesInput, '1');
    await user.clear(secondsInput);

    await submitForm(user);

    const { body } = await read();

    expect(body.timeout).toBe(60000);
  });
});
