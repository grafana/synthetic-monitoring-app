import React from 'react';
import { screen } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { ConfirmUnsavedModal } from './ConfirmUnsavedModal';

describe('<ConfirmUnsavedModal>', () => {
  it('should show when rendered', async () => {
    render(<ConfirmUnsavedModal onLeavePage={jest.fn()} onStayOnPage={jest.fn()} />);

    expect(await screen.findByTestId(DataTestIds.CONFIRM_UNSAVED_MODAL_HEADING)).toBeInTheDocument();
  });

  it('should call onLeavePage when leave page button clicked', async () => {
    const onLeavePage = jest.fn();
    render(<ConfirmUnsavedModal onLeavePage={onLeavePage} onStayOnPage={jest.fn()} />);

    await screen.findByText('Leave page').then((button) => button.click());

    expect(onLeavePage).toHaveBeenCalled();
  });

  it('should call onStayOnPage when stay on page button clicked', async () => {
    const onStayOnPage = jest.fn();
    render(<ConfirmUnsavedModal onLeavePage={jest.fn()} onStayOnPage={onStayOnPage} />);

    await screen.findByText('Stay on page').then((button) => button.click());

    expect(onStayOnPage).toHaveBeenCalled();
  });

  it('should call onStayOnPage when modal is dismissed (button)', async () => {
    const onStayOnPage = jest.fn();
    const { user } = render(<ConfirmUnsavedModal onLeavePage={jest.fn()} onStayOnPage={onStayOnPage} />);

    await screen.findByTestId('confirm-unsaved-modal-heading');
    const closeButton = screen.getByRole('button', { name: 'Close' });

    await user.click(closeButton);

    expect(onStayOnPage).toHaveBeenCalled();
  });

  it('should call onStayOnPage when modal is dismissed (keyboard)', async () => {
    const onStayOnPage = jest.fn();
    const { user } = render(<ConfirmUnsavedModal onLeavePage={jest.fn()} onStayOnPage={onStayOnPage} />);

    await screen.findByTestId('confirm-unsaved-modal-heading');
    await user.keyboard('{Esc}');

    expect(onStayOnPage).toHaveBeenCalled();
  });
});
