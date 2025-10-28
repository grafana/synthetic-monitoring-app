import { screen } from '@testing-library/react';

import { CheckType, MultiHttpAssertionType } from 'types';
import { gotoSection, selectComboboxOption, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { AssertionConditionVariant, AssertionSubjectVariant } from 'components/MultiHttp/MultiHttpTypes';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const FIFTEEN_SECONDS_IN_MS = 15 * 1000;
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.timeout).toBe(FIFTEEN_SECONDS_IN_MS);
  });

  // should this be made into a matrix that tests all the dropdown permutations?
  describe(`Request Assertions`, () => {
    it(`can add a text assertion`, async () => {
      const ASSERTION_VALUE = `some lovely value`;

      const { user, read } = await renderNewFormV2(checkType);

      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);
      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      await selectComboboxOption(user, screen.getByLabelText(/Assertion type/), /Text/);
      await selectComboboxOption(user, screen.getByLabelText(/^Subject/), /Body/);
      await selectComboboxOption(user, screen.getByLabelText(/Condition/), /Contains/);

      await user.type(screen.getByLabelText(/^Value/), ASSERTION_VALUE);

      await submitForm(user);

      const { body } = await read();

      expect(body.settings.multihttp.entries[0].checks).toEqual([
        {
          type: MultiHttpAssertionType.Text,
          subject: AssertionSubjectVariant.ResponseBody,
          condition: AssertionConditionVariant.Contains,
          value: ASSERTION_VALUE,
        },
      ]);
    });

    it(`can add a json path value assertion`, async () => {
      const ASSERTION_VALUE = `some lovely value`;
      const EXPRESSION_VALUE = `some lovely expression`;

      const { user, read } = await renderNewFormV2(checkType);

      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);
      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      await selectComboboxOption(user, screen.getByLabelText(/Assertion type/), /JSON path value/);
      await user.type(screen.getByLabelText(/^Expression/), EXPRESSION_VALUE);

      await selectComboboxOption(user, screen.getByLabelText(/Condition/), /Contains/);
      await user.type(screen.getByLabelText(/^Value/), ASSERTION_VALUE);

      await submitForm(user);

      const { body } = await read();

      expect(body.settings.multihttp.entries[0].checks).toEqual([
        {
          type: MultiHttpAssertionType.JSONPathValue,
          expression: EXPRESSION_VALUE,
          condition: AssertionConditionVariant.Contains,
          value: ASSERTION_VALUE,
        },
      ]);
    });

    it(`can add a json path assertion`, async () => {
      const EXPRESSION_VALUE = `some lovely expression`;

      const { user, read } = await renderNewFormV2(checkType);

      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);
      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      // await selectOption(user, { label: `Assertion type`, option: `JSON path` });
      await selectComboboxOption(user, screen.getByLabelText(/Assertion type/), /JSON path$/);
      await user.type(screen.getByLabelText(/^Expression/), EXPRESSION_VALUE);

      await submitForm(user);

      const { body } = await read();

      expect(body.settings.multihttp.entries[0].checks).toEqual([
        {
          type: MultiHttpAssertionType.JSONPath,
          expression: EXPRESSION_VALUE,
        },
      ]);
    });

    it(`can add a regex assertion`, async () => {
      const EXPRESSION_VALUE = `some lovely value`;

      const { user, read } = await renderNewFormV2(checkType);

      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);
      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      await selectComboboxOption(user, screen.getByLabelText(/Assertion type/), /Regex/);
      await selectComboboxOption(user, screen.getByLabelText(/Subject/), /Body/);

      await user.type(screen.getByLabelText(/^Expression/), EXPRESSION_VALUE);

      await submitForm(user);

      const { body } = await read();

      expect(body.settings.multihttp.entries[0].checks).toEqual([
        {
          type: MultiHttpAssertionType.Regex,
          subject: AssertionSubjectVariant.ResponseBody,
          expression: EXPRESSION_VALUE,
        },
      ]);
    });

    it(`can add multiple assertions for a single request`, async () => {
      const EXPRESSION_VALUE_1 = `some lovely value`;
      const EXPRESSION_VALUE_2 = `some other lovely value`;

      const { user, read } = await renderNewFormV2(checkType);

      await fillMandatoryFields({ user, checkType });
      await gotoSection(user, FormSectionName.Uptime);
      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      // await selectOption(user, { label: `Assertion type`, option: `Regex` });
      await selectComboboxOption(user, screen.getAllByLabelText(/Assertion type/)[0], /Regex/);
      // await selectOption(user, { label: /^Subject/, option: `Body` });
      await selectComboboxOption(user, screen.getAllByLabelText(/Subject/)[0], /Body/);
      await user.type(screen.getAllByLabelText(/^Expression/)[0], EXPRESSION_VALUE_1);

      await user.click(screen.getByRole('button', { name: 'Assertion' }));

      await selectComboboxOption(user, screen.getAllByLabelText(/Assertion type/)[1], /JSON path$/);
      await user.type(screen.getAllByLabelText(/^Expression/)[1], EXPRESSION_VALUE_2);

      await submitForm(user);

      const { body } = await read();

      expect(body.settings.multihttp.entries[0].checks).toEqual([
        {
          type: MultiHttpAssertionType.Regex,
          subject: AssertionSubjectVariant.ResponseBody,
          expression: EXPRESSION_VALUE_1,
        },
        {
          type: MultiHttpAssertionType.JSONPath,
          expression: EXPRESSION_VALUE_2,
        },
      ]);
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
