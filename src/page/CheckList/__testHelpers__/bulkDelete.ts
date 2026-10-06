import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { DELETE_CONFIRMATION_TEXT } from 'page/CheckList/components/BulkActions.hooks';

/** Rendered by @grafana/ui's ConfirmModal when it is given a `confirmationText`. */
export function getDeleteConfirmationInput(confirmationText = DELETE_CONFIRMATION_TEXT) {
  return screen.getByPlaceholderText(`Type "${confirmationText}" to confirm`);
}

/** `confirmationText` must match what the modal actually shows (see DELETE_CONFIRMATION_COUNT_THRESHOLD). */
export async function confirmBulkDelete(user: UserEvent, confirmationText = DELETE_CONFIRMATION_TEXT) {
  const confirmButton = await screen.findByRole('button', { name: 'Delete checks' });
  expect(confirmButton).toBeDisabled();

  await user.type(getDeleteConfirmationInput(confirmationText), confirmationText);

  expect(confirmButton).toBeEnabled();
  await user.click(confirmButton);
}
