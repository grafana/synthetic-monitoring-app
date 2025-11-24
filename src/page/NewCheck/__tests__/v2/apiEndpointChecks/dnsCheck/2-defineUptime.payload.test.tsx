import { screen } from '@testing-library/react';

import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType, DnsResponseCodes } from 'types';
import {
  gotoSection,
  removeComboboxOption,
  selectComboboxOption,
  submitForm,
} from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THREE_SECONDS_IN_MS = 3 * 1000;
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.dns.validRCodes).toEqual([DnsResponseCodes.NOERROR]);
    expect(body.timeout).toBe(THREE_SECONDS_IN_MS);
  });

  it(`can add valid response codes`, async () => {
    const RESPONSE_CODES = [DnsResponseCodes.BADVERS, DnsResponseCodes.BADCOOKIE];

    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Uptime);
    await removeComboboxOption(user, DnsResponseCodes.NOERROR);
    await user.click(screen.getByPlaceholderText(/Select valid response codes/));

    for (const option of RESPONSE_CODES) {
      await user.click(screen.getByRole('option', { name: option }));
    }
    await submitForm(user);

    const { body } = await read();

    expect(body.settings.dns.validRCodes).toEqual(RESPONSE_CODES);
  });

  describe(`can add valid response matches`, () => {
    it(`can fail if authority matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Authority/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAuthorityRRS).toEqual({
        failIfMatchesRegexp: [EXPRESSION],
        failIfNotMatchesRegexp: [],
      });
    });

    it(`can fail if authority NOT matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Authority/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);

      await user.click(screen.getByLabelText(`Invert match for validation 1`));

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAuthorityRRS).toEqual({
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [EXPRESSION],
      });
    });

    it(`can fail if answer matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Answer/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAnswerRRS).toEqual({
        failIfMatchesRegexp: [EXPRESSION],
        failIfNotMatchesRegexp: [],
      });
    });

    it(`can fail if answer NOT matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Answer/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);

      await user.click(screen.getByLabelText(`Invert match for validation 1`));

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAnswerRRS).toEqual({
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [EXPRESSION],
      });
    });

    it(`can fail if additional matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Additional/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAdditionalRRS).toEqual({
        failIfMatchesRegexp: [EXPRESSION],
        failIfNotMatchesRegexp: [],
      });
    });

    it(`can fail if additional NOT matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);

      await user.click(screen.getByRole('button', { name: /Regexp validation/ }));
      await selectComboboxOption(user, screen.getByLabelText('Match subject for validation 1'), /Additional/);

      const expressionInput = screen.getByLabelText('Expression for validation 1');
      await user.type(expressionInput, EXPRESSION);
      await user.click(screen.getByLabelText(`Invert match for validation 1`));

      await submitForm(user);
      const { body } = await read();

      expect(body.settings.dns.validateAdditionalRRS).toEqual({
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [EXPRESSION],
      });
    });
  });

  it(`can set the timeout`, async () => {
    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Uptime);

    const minutesInput = screen.getByLabelText('timeout minutes input');
    const secondsInput = screen.getByLabelText('timeout seconds input');
    await user.type(minutesInput, '1');
    await user.clear(secondsInput);

    await submitForm(user);

    const { body } = await read();

    expect(body.timeout).toBe(60000);
  });
});
