import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';

import { CheckType } from 'types';
import { goToSectionV2, renderNewForm, submitForm, testCheck } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 5 (Execution) UI`, () => {
  it(`validates the form and goes to the first error when clicking submit`, async () => {
    const { user } = await renderNewForm(checkType);

    await goToSectionV2(user, FormStepOrder.Labels);
    const addLabelButton = screen.getByText('Add label', { selector: 'button > span' });
    await user.click(addLabelButton);
    await submitForm(user);
    expect(screen.getByText(`Job name is required`)).toBeInTheDocument();
  });

  it(`displays the test button`, async () => {
    const { user } = await renderNewForm(checkType);
    await goToSectionV2(user, FormStepOrder.Alerting); // last step

    const actionsBar = screen.getByTestId(DataTestIds.ACTIONS_BAR);
    expect(within(actionsBar).getByText('Test')).toBeInTheDocument();
  });

  it(`validates the form and goes to the first error when clicking test`, async () => {
    const { user } = await renderNewForm(checkType);

    await goToSectionV2(user, FormStepOrder.Alerting);
    await testCheck(user);
    expect(screen.getByText(`Job name is required`)).toBeInTheDocument();
  });
});
