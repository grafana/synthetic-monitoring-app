import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DEFAULT_FOLDER, FOLDER_EXTERNAL, FOLDER_PRODUCTION, FOLDER_READONLY } from 'test/fixtures/folders';
import { render } from 'test/render';
import {
  runTestWithNoEditableFolders,
  runTestWithReadOnlyDefaultFolder,
  runTestWithSingleEditableFolder,
} from 'test/utils';

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

  it('auto-selects the default folder when the user can edit it', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(DEFAULT_FOLDER.uid));
  });

  it('does not preselect anything when the default folder is read-only and several folders are editable', async () => {
    runTestWithReadOnlyDefaultFolder();

    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByPlaceholderText(/Select a folder/)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('preselects the only editable folder when the default folder is read-only', async () => {
    runTestWithSingleEditableFolder();

    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(FOLDER_PRODUCTION.uid));
  });

  it('explains the dead end when the user cannot edit any folder', async () => {
    runTestWithNoEditableFolders();

    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByText(/You don't have permission to store checks in any folder/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Edit access to the "${DEFAULT_FOLDER.title}" folder`))).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Select a folder/)).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a not found label for a deleted or missing folder', async () => {
    const onChange = jest.fn();
    render(<FolderSelector value="deleted-folder-uid" onChange={onChange} />);

    expect(await screen.findByDisplayValue('deleted-folder-uid (folder not found)')).toBeInTheDocument();
  });

  it('shows the folder title with a read-only suffix for a readable folder the user cannot edit', async () => {
    const onChange = jest.fn();
    render(<FolderSelector value={FOLDER_READONLY.uid} onChange={onChange} />);

    expect(await screen.findByDisplayValue(`${FOLDER_READONLY.title} (read-only)`)).toBeInTheDocument();
  });

  it('shows the folder title for an editable folder outside the default subtree', async () => {
    const onChange = jest.fn();
    render(<FolderSelector value={FOLDER_EXTERNAL.uid} onChange={onChange} />);

    expect(await screen.findByDisplayValue(FOLDER_EXTERNAL.title)).toBeInTheDocument();
  });
});
