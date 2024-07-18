import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.traceroute.maxHops).toBe(64);
    expect(body.settings.traceroute.maxUnknownHops).toBe(15);
    expect(body.settings.traceroute.ptrLookup).toBe(true);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `example.com`;

    const { read, user } = await renderNewForm(checkType);
    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(REQUEST_TARGET);
  });

  describe(`Request options`, () => {
    it(`can change the max hops`, async () => {
      const MAX_HOPS = 30;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      const maxHopsInput = screen.getByLabelText('Max hops', { exact: false });
      await user.clear(maxHopsInput);
      await user.type(maxHopsInput, MAX_HOPS.toString());

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.traceroute.maxHops).toBe(MAX_HOPS);
    });
  });

  it(`can change the max unknown hops`, async () => {
    const MAX_UNKNOWN_HOPS = 3;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    const maxUnknownHopsInput = screen.getByLabelText('Max unknown hops', { exact: false });
    await user.clear(maxUnknownHopsInput);
    await user.type(maxUnknownHopsInput, MAX_UNKNOWN_HOPS.toString());

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.traceroute.maxUnknownHops).toBe(MAX_UNKNOWN_HOPS);
  });

  it(`can disable PTR lookup`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));

    await user.click(screen.getByLabelText('PTR lookup', { exact: false }));
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.traceroute.ptrLookup).toBe(false);
  });
});
