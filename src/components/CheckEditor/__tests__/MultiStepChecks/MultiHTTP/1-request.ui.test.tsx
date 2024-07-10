import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';

import { CheckType } from 'types';
import { renderNewForm } from 'components/CheckEditor/__testHelpers__/checkForm';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 2 (Define uptime) UI`, () => {
  it(`can delete requests`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText(`Add request`));

    const request = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    await user.click(within(request).getByLabelText('Remove request', { exact: false }));
    expect(request).not.toBeInTheDocument();
  });
});
