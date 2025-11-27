import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

export function getAdhocCheckTestButton() {
  return screen.queryByTestId(CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root);
}

export async function doAdhocCheck(user: UserEvent) {
  const button = getAdhocCheckTestButton();
  expect(button).toBeInTheDocument();
  await user.click(button!);
}
