import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Toggletip } from './Toggletip';

function ControlledToggletip() {
  const [open, setOpen] = useState(false);

  return (
    <Toggletip
      content={
        <>
          <span>Controlled content</span>
          <button onClick={() => setOpen(false)} type="button">
            Finish
          </button>
        </>
      }
      open={open}
      onOpenChange={setOpen}
    >
      <button type="button">
        Open details
      </button>
    </Toggletip>
  );
}

describe('Toggletip', () => {
  it('supports controlled close and restores focus to the trigger', async () => {
    const user = userEvent.setup();

    render(<ControlledToggletip />);

    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);
    expect(screen.getByTestId('toggletip-content')).toHaveTextContent('Controlled content');

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.queryByTestId('toggletip-content')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
