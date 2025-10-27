import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { ADHOC_CHECK_TEST_IDS } from '../constants';

export function getAdhocCheckTestButton() {
  return screen.getByTestId(new RegExp(`^${ADHOC_CHECK_TEST_IDS.testButton}`));
}

export async function doAdhocCheck(user: UserEvent) {
  const button = getAdhocCheckTestButton();
  expect(button).toBeInTheDocument();
  await user.click(button);
}
