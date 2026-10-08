import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

export async function addConnection(user: UserEvent, type: 'Frontend application' | 'Service') {
  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  await user.click(await screen.findByRole('menuitem', { name: type }));
}
