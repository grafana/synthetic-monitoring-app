import { screen, waitFor } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields, setupChannelTest, setupFormWithChannelSelector } from 'page/__testHelpers__/scripted';

const checkType = CheckType.Browser;

describe(`BrowserCheck - 1 (Script) payload`, () => {
  it(`can add a job name`, async () => {
    const JOB_NAME = `scripted job name`;

    const { read, user } = await renderNewForm(checkType);
    await user.type(screen.getByLabelText(`Job name`, { exact: false }), JOB_NAME);
    await fillMandatoryFields({ user, fieldsToOmit: [`job`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.job).toBe(JOB_NAME);
  });

  it(`can add an instance`, async () => {
    const INSTANCE = `a lovely instance`;

    const { read, user } = await renderNewForm(checkType);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), INSTANCE);
    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.target).toBe(INSTANCE);
  });

  it.skip(`can add a script`, async () => {
    // it uses MonacoEditor, which is not supported by the current testing setup
  });

  it(`can add a channel to the payload`, async () => {
    setupChannelTest();
    const { read, user } = await setupFormWithChannelSelector(checkType);
    await submitForm(user);
    const { body } = await read();
    expect(body.settings.browser.channel).toBe('v1');
  });

  it(`can select and submit a non-default channel`, async () => {
    setupChannelTest();
    const { read, user, channelSelector } = await setupFormWithChannelSelector(checkType);
    await user.selectOptions(channelSelector, 'v2');
    await waitFor(() => {
      expect(channelSelector).toHaveValue('v2');
    });
    await submitForm(user);
    const { body } = await read();
    expect(body.settings.browser.channel).toBe('v2');
  });
});
