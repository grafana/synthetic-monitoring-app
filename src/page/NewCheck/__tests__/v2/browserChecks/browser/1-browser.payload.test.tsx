import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';

import { CheckType } from 'types';
import { EMPTY_METADATA } from 'components/CheckEditor/ProbesMetadata';
import { selectComboboxOption, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { setupFormWithChannelSelector } from 'page/__testHelpers__/channel';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

jest.mock('data/useProbes', () => ({
  ...jest.requireActual('data/useProbes'),
  useProbesWithMetadata: jest.fn(() => ({
    data: [
      {
        ...EMPTY_METADATA,
        ...PRIVATE_PROBE,
        displayName: PRIVATE_PROBE.name,
        k6Versions: {
          v1: 'v1.2.3',
          v2: 'v2.0.0',
        },
      },
    ],
    isLoading: false,
  })),
}));

const checkType = CheckType.Browser;

describe(`BrowserCheck - 1 (Script) payload`, () => {
  it(`can add a job name`, async () => {
    const JOB_NAME = `scripted job name`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.type(screen.getByLabelText(`Job name`, { exact: false }), JOB_NAME);
    await fillMandatoryFields({ user, fieldsToOmit: [`job`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.job).toBe(JOB_NAME);
  });

  it(`can add an instance`, async () => {
    const INSTANCE = `a lovely instance`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), INSTANCE);
    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.target).toBe(INSTANCE);
  });

  it.skip(`can add a script`, async () => {
    // it uses MonacoEditor, which is not supported by the current testing setup
  });

  it(`includes default channel in the payload`, async () => {
    const { read, user } = await setupFormWithChannelSelector(checkType);
    await submitForm(user);
    const { body } = await read();
    expect(body.settings.browser.channel).toBe('v1');
  });

  it(`can select and submit a non-default channel`, async () => {
    const { read, user, channelCombobox } = await setupFormWithChannelSelector(checkType);

    await selectComboboxOption(user, channelCombobox, /v2\.x/i);

    await submitForm(user);
    const { body } = await read();
    expect(body.settings.browser.channel).toBe('v2');
  });

  it(`omits channel from payload when feature is disabled`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, fieldsToOmit: [], checkType });
    await submitForm(user);
    const { body } = await read();
    expect(body.settings.browser).not.toHaveProperty('channel');
  });
});
