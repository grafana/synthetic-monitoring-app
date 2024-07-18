import { screen, within } from '@testing-library/react';
import { getSelect, selectOption } from 'test/utils';

import { CheckType, DnsResponseCodes } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THREE_SECONDS_IN_MS = 3 * 1000;
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.dns.validRCodes).toEqual([DnsResponseCodes.NOERROR]);
    expect(body.timeout).toBe(THREE_SECONDS_IN_MS);
  });

  it(`can add valid response codes`, async () => {
    const RESPONSE_CODES = [DnsResponseCodes.BADVERS, DnsResponseCodes.BADCOOKIE];

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 2);

    const [select] = await getSelect({ label: `Valid response codes` });
    await user.click(within(select).getByLabelText(`Remove`));

    for (const option of RESPONSE_CODES) {
      await selectOption(user, { label: `Valid response codes`, option });
    }

    await submitForm(user);

    const { body } = await read();

    expect(body.settings.dns.validRCodes).toEqual(RESPONSE_CODES);
  });

  describe(`can add valid response matches`, () => {
    it(`can fail if authority matches`, async () => {
      const EXPRESSION = 'test expression';

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Authority matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Authority matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Answer matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Answer matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Additional matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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

      const { user, read } = await renderNewForm(checkType);
      await fillMandatoryFields({ user, checkType });
      await goToSection(user, 2);

      await user.click(screen.getByText('Add Regex Validation'));
      await selectOption(user, { label: `DNS Response Match 1`, option: `Fail if Additional matches` });

      const expressionInput = screen.getByLabelText('Regex expression for validation 1');
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
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 2);

    const minutesInput = screen.getByLabelText('timeout minutes input');
    const secondsInput = screen.getByLabelText('timeout seconds input');
    await user.type(minutesInput, '1');
    await user.clear(secondsInput);

    await submitForm(user);

    const { body } = await read();

    expect(body.timeout).toBe(60000);
  });
});
