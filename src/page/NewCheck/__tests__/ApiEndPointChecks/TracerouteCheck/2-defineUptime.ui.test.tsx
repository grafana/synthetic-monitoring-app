import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSectionV2, renderNewForm } from 'page/__testHelpers__/checkForm';

import { FormSectionIndex } from '../../../../../components/CheckForm/constants';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 2 (Define uptime) UI`, () => {
  it(`the timeout is set at 30 seconds`, async () => {
    const { user } = await renderNewForm(checkType);
    await goToSectionV2(user, FormSectionIndex.Uptime);

    const timeout = await screen.findByLabelText(/Timeout/);
    expect(timeout).toHaveValue(`30`);
  });
});
