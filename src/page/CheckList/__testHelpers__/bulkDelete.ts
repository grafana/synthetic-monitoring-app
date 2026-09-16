import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { DELETE_CONFIRMATION_TEXT } from 'page/CheckList/components/BulkActions.hooks';

/** Rendered by @grafana/ui's ConfirmModal when it is given a `confirmationText`. */
export function getDeleteConfirmationInput() {
  return screen.getByPlaceholderText(`Type "${DELETE_CONFIRMATION_TEXT}" to confirm`);
}

/**
 * Bulk deletion is gated behind a typed confirmation, so every test that wants
 * checks actually deleted has to go through the same motions the user does.
 */
export async function confirmBulkDelete(user: UserEvent) {
  const confirmButton = await screen.findByRole('button', { name: 'Delete checks' });
  expect(confirmButton).toBeDisabled();

  await user.type(getDeleteConfirmationInput(), DELETE_CONFIRMATION_TEXT);

  expect(confirmButton).toBeEnabled();
  await user.click(confirmButton);
}
