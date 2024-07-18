import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';

import { CheckType } from 'types';
import { goToSection, renderNewForm } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 2 (Define uptime) UI`, () => {
  it(`displays variables which are available in subsequent requests`, async () => {
    const VAR_1 = 'a lovely variable';
    const VAR_2 = 'another lovely variable';

    const { user } = await renderNewForm(checkType);

    await user.click(screen.getByText('Set variables'));
    await user.click(screen.getByText('Add variable'));
    await user.type(screen.getByLabelText('Variable name', { exact: false }), VAR_1);

    await user.click(screen.getByText(`Add request`));

    const request2 = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    expect(within(request2).getByText(`\${${VAR_1}}`)).toBeInTheDocument();

    await user.click(within(request2).getByText('Set variables'));
    await user.click(within(request2).getByText('Add variable'));
    await user.type(within(request2).getByLabelText('Variable name', { exact: false }), VAR_2);

    await user.click(screen.getByText(`Add request`));
    const request3 = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-2`);

    expect(within(request3).getByText(`\${${VAR_1}}`)).toBeInTheDocument();
    expect(within(request3).getByText(`\${${VAR_2}}`)).toBeInTheDocument();
  });

  it(`displays the correct amount of assertion fields corresponding to the amount of requests`, async () => {
    const { user } = await renderNewForm(checkType);

    await user.click(screen.getByText(`Add request`));
    await user.click(screen.getByText(`Add request`));

    await goToSection(user, 2);

    const selector = new RegExp(`^${DataTestIds.REQUEST_ASSERTION}-`);
    expect(screen.getAllByTestId(selector)).toHaveLength(3);
  });
});
