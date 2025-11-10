import { screen, within } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 2 (Define uptime) UI`, () => {
  it(`can delete requests`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByRole('button', { name: 'Request' }));

    const request = screen.getByLabelText('Request entry 2');
    expect(request).toBeInTheDocument();
    await user.click(within(request).getByLabelText('Delete request', { exact: false }));
    expect(request).not.toBeInTheDocument();
  });
});
