import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm } from 'components/CheckEditor/__testHelpers__/checkForm';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 2 (Define uptime) UI`, () => {
  it(`the timeout is set at 30 seconds`, async () => {
    const { user } = await renderNewForm(checkType);
    await goToSection(user, 2);

    const timeout = await screen.findByLabelText(/Timeout/);
    expect(timeout).toHaveValue(`30`);
  });
});
