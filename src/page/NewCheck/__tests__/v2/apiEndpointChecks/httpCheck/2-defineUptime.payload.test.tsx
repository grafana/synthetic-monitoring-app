import { screen } from '@testing-library/react';

import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType, HTTPCompressionAlgo, HttpVersion } from 'types';
import { gotoSection, selectRadioGroupOption, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

import { testUsesCombobox } from '../../../../../../test/utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THREE_SECONDS_IN_MS = 3 * 1000;
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(false);
    expect(body.timeout).toBe(THREE_SECONDS_IN_MS);
  });

  it(`can add valid status codes`, async () => {
    testUsesCombobox();
    const ALL_GOOD_STATUS_CODE = 200;
    const NOT_MODIFIED_STATUS_CODE = 304;

    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Uptime);
    await user.click(screen.getByPlaceholderText('2xx'));
    await user.click(screen.getByText(String(ALL_GOOD_STATUS_CODE)));
    await user.click(screen.getByText(String(NOT_MODIFIED_STATUS_CODE)));

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.validStatusCodes).toEqual([ALL_GOOD_STATUS_CODE, NOT_MODIFIED_STATUS_CODE]);
  });

  it(`can add valid HTTP versions`, async () => {
    testUsesCombobox();
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Uptime);
    await user.click(screen.getByPlaceholderText('Select version(s)'));
    await user.click(screen.getByText('HTTP/1.0'));
    await user.click(screen.getByText('HTTP/2'));

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.validHTTPVersions).toEqual([HttpVersion.HTTP1_0, HttpVersion.HTTP2_0]);
  });

  it(`ignores SSL`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Uptime);
    await user.click(screen.getByLabelText('Ignore SSL'));

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(false);
  });

  it(`fails if SSL is present`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Uptime);
    await user.click(screen.getByLabelText('Fail if SSL is present'));

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(true);
  });

  it(`fails if SSL is not present`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Uptime);
    await user.click(screen.getByLabelText('Fail if SSL is not present'));

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.failIfNotSSL).toBe(true);
    expect(body.settings.http.failIfSSL).toBe(false);
  });

  describe(`can add regex validations`, () => {
    describe(`header validations`, () => {
      it(`can add a failing check if it matches a regex`, async () => {
        const HEADER_NAME = `X-Header-Name`;
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));

        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Header/ }));

        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfHeaderMatchesRegexp).toEqual([
          {
            allowMissing: false,
            header: HEADER_NAME,
            regexp: REGEX,
          },
        ]);
      });

      it(`can add a failing check if it matches a regex and is allowed to be missing`, async () => {
        const HEADER_NAME = `X-Header-Name`;
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));
        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Header/ }));

        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);

        await user.click(screen.getByLabelText('Allow missing header for validation 1'));

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfHeaderMatchesRegexp).toEqual([
          {
            allowMissing: true,
            header: HEADER_NAME,
            regexp: REGEX,
          },
        ]);
      });

      it(`can add a failing check if it does not match a regex`, async () => {
        const HEADER_NAME = `X-Header-Name`;
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));
        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Header/ }));

        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);
        await user.click(screen.getByLabelText('Invert match for validation 1'));

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfHeaderNotMatchesRegexp).toEqual([
          {
            allowMissing: false,
            header: HEADER_NAME,
            regexp: REGEX,
          },
        ]);
      });

      it(`can add a failing check if it does not match a regex and is allowed to be missing`, async () => {
        const HEADER_NAME = `X-Header-Name`;
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));
        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Header/ }));

        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);
        await user.click(screen.getByLabelText('Invert match for validation 1'));
        await user.click(screen.getByLabelText('Allow missing header for validation 1'));

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfHeaderNotMatchesRegexp).toEqual([
          {
            allowMissing: true,
            header: HEADER_NAME,
            regexp: REGEX,
          },
        ]);
      });
    });

    describe(`body validations`, () => {
      it(`can add a failing check if it matches a regex`, async () => {
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));
        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Body/ }));
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfBodyMatchesRegexp).toEqual([REGEX]);
      });

      it(`can add a failing check if it does not match a regex`, async () => {
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewFormV2(checkType);
        await fillMandatoryFields({ user, checkType });

        await gotoSection(user, FormSectionName.Uptime);
        await user.click(screen.getByRole('button', { name: 'Regexp validation' }));
        await user.click(screen.getByLabelText('Source for validation 1'));
        await user.click(screen.getByRole('menuitem', { name: /Body/ }));
        await user.type(screen.getByLabelText('Regular expression for validation 1'), REGEX);
        await user.click(screen.getByLabelText('Invert match for validation 1'));

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfBodyNotMatchesRegexp).toEqual([REGEX]);
      });
    });
  });

  it(`can add a compression option`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Uptime);

    await selectRadioGroupOption(user, 'Compression', 'gzip');

    await submitForm(user);
    const { body } = await read();
    expect(body.settings.http.compression).toBe(HTTPCompressionAlgo.gzip);
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
