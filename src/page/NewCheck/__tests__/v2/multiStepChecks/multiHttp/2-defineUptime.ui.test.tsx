import { screen, within } from '@testing-library/react';

import { CheckType } from 'types';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 2 (Define uptime) UI`, () => {
  it(`displays variables which are available in subsequent requests`, async () => {
    const VAR_1 = 'a lovely variable';
    const VAR_2 = 'another lovely variable';

    const { user } = await renderNewFormV2(checkType);
    const entry1 = screen.getByLabelText(`Request entry 1`);
    await user.click(within(entry1).getByText(`Variables`));
    await user.click(within(entry1).getByRole('button', { name: 'Variable' }));

    await user.type(screen.getByLabelText('Variable name', { exact: false }), VAR_1);

    const addRequestButton = screen.getByRole('button', { name: 'Request' });

    await user.click(addRequestButton);

    const entry2 = screen.getByLabelText(`Request entry 2`);
    expect(within(entry2).getByText(`\${${VAR_1}}`)).toBeInTheDocument();

    await user.click(within(entry2).getByText(`Variables`));
    await user.click(within(entry2).getByRole('button', { name: 'Variable' }));
    await user.type(within(entry2).getByLabelText('Variable name', { exact: false }), VAR_2);

    await user.click(addRequestButton);
    const entry3 = screen.getByLabelText(`Request entry 3`);

    expect(within(entry3).getByText(`\${${VAR_1}}`)).toBeInTheDocument();
    expect(within(entry3).getByText(`\${${VAR_2}}`)).toBeInTheDocument();
  });

  it(`displays the correct amount of assertion fields corresponding to the amount of requests`, async () => {
    const { user } = await renderNewFormV2(checkType);
    const addRequestButton = screen.getByRole('button', { name: 'Request' });
    await user.click(addRequestButton);
    await user.click(addRequestButton);

    await gotoSection(user, FormSectionName.Uptime);

    expect(screen.getAllByLabelText(/Request assertion \d+/)).toHaveLength(3);
  });
});
