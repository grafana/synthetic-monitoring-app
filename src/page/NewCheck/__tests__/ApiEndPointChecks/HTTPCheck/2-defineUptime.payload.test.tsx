import { screen } from '@testing-library/react';
import { selectOption } from 'test/utils';

import { CheckType, HTTPCompressionAlgo, HttpVersion } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THREE_SECONDS_IN_MS = 3 * 1000;
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(false);
    expect(body.timeout).toBe(THREE_SECONDS_IN_MS);
  });

  it(`can add valid status codes`, async () => {
    const ALL_GOOD_STATUS_CODE = 200;
    const I_AM_A_TEAPOT_STATUS_CODE = 418;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);
    await selectOption(user, { label: 'Valid status codes', option: String(ALL_GOOD_STATUS_CODE) });
    await selectOption(user, { label: 'Valid status codes', option: String(I_AM_A_TEAPOT_STATUS_CODE) });

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.validStatusCodes).toEqual([ALL_GOOD_STATUS_CODE, I_AM_A_TEAPOT_STATUS_CODE]);
  });

  it(`can add valid HTTP versions`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);
    await selectOption(user, { label: 'Valid HTTP versions', option: `HTTP/1.0` });
    await selectOption(user, { label: 'Valid HTTP versions', option: `HTTP/2` });

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.validHTTPVersions).toEqual([HttpVersion.HTTP1_0, HttpVersion.HTTP2_0]);
  });

  it(`ignores SSL`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);
    await selectOption(user, { label: 'SSL options', option: `Ignore SSL` });

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(false);
  });

  it(`fails if SSL is present`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);
    await selectOption(user, { label: 'SSL options', option: `Probe fails if SSL is present` });

    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.failIfNotSSL).toBe(false);
    expect(body.settings.http.failIfSSL).toBe(true);
  });

  it(`fails if SSL is not present`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);
    await selectOption(user, { label: 'SSL options', option: `Probe fails if SSL is not present` });

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

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response header matches',
        });
        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);

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

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response header matches',
        });
        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);
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

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response header matches',
        });
        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);
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

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response header matches',
        });
        await user.type(screen.getByLabelText('Header name for validation 1'), HEADER_NAME);
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);
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

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response body matches',
        });
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfBodyMatchesRegexp).toEqual([REGEX]);
      });

      it(`can add a failing check if it does not match a regex`, async () => {
        const REGEX = `some nice regex`;

        const { read, user } = await renderNewForm(checkType);
        await fillMandatoryFields({ user, checkType });

        await goToSection(user, 2);
        await user.click(screen.getByText('Add Regex Validation'));
        await selectOption(user, {
          label: 'Validation Field Name 1',
          option: 'Check fails if response body matches',
        });
        await user.type(screen.getByLabelText('Regex expression for validation 1'), REGEX);
        await user.click(screen.getByLabelText('Invert match for validation 1'));

        await submitForm(user);

        const { body } = await read();
        expect(body.settings.http.failIfBodyNotMatchesRegexp).toEqual([REGEX]);
      });
    });
  });

  it(`can add a compression option`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 2);
    await selectOption(user, { label: 'Compression option', option: 'gzip' });

    await submitForm(user);
    const { body } = await read();
    expect(body.settings.http.compression).toBe(HTTPCompressionAlgo.gzip);
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
