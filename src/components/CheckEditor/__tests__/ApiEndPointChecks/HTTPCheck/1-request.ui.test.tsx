import { screen, within } from '@testing-library/react';

import { CheckType, HttpMethod } from 'types';
import { renderForm } from 'components/CheckEditor/__tests__/helpers';
import { getSelect } from 'components/CheckEditor/testHelpers';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) UI`, () => {
  it(`has HTTP selected in the request type`, async () => {
    await renderForm(checkType);

    const requestType = await screen.getByRole('radiogroup');
    expect(within(requestType).getByLabelText('HTTP')).toBeChecked();
  });

  it(`has GET method selected by default in request target`, async () => {
    await renderForm(checkType);

    const [methodSelect] = await getSelect({ label: 'Request method' });
    expect(within(methodSelect).getByText(HttpMethod.GET)).toBeInTheDocument();
  });
});
