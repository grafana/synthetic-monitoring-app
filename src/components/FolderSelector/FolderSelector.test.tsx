import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { FolderSelector } from './FolderSelector';

describe('FolderSelector', () => {
  it('renders with placeholder', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByPlaceholderText(/Select a folder/)).toBeInTheDocument();
  });

  it('shows the create folder button', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByRole('button', { name: /Create folder/ })).toBeInTheDocument();
  });

  it('hides the create folder button when disabled', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} disabled />);

    await screen.findByPlaceholderText(/Select a folder/);
    expect(screen.queryByRole('button', { name: /Create folder/ })).not.toBeInTheDocument();
  });
});
