import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 2 (Define uptime) UI`, () => {
  it(`the timeout is set at 30 seconds`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await gotoSection(user, FormSectionName.Uptime);

    const timeout = await screen.findByLabelText(/Timeout/);
    expect(timeout).toHaveValue(`30`);
  });
});
