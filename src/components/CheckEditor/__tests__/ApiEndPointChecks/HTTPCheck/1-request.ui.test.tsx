import { screen, within } from '@testing-library/react';
import { getSelect } from 'test/utils';

import { CheckType, HttpMethod } from 'types';
import { renderNewForm } from 'components/CheckEditor/__testHelpers__/checkForm';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) UI`, () => {
  it(`has HTTP selected in the request type`, async () => {
    await renderNewForm(checkType);

    const requestType = await screen.getByRole('radiogroup');
    expect(within(requestType).getByLabelText('HTTP')).toBeChecked();
  });

  it(`has GET method selected by default in request target`, async () => {
    await renderNewForm(checkType);

    const [methodSelect] = await getSelect({ label: 'Request method' });
    expect(within(methodSelect).getByText(HttpMethod.GET)).toBeInTheDocument();
  });
});
