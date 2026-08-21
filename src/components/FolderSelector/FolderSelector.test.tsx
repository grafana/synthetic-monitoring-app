import React from 'react';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { DEFAULT_FOLDER, FOLDER_EXTERNAL, FOLDER_PRODUCTION, FOLDER_READONLY } from 'test/fixtures/folders';
import { createWrapper, render } from 'test/render';
import {
  runTestWithNoEditableFolders,
  runTestWithReadOnlyDefaultFolder,
  runTestWithSingleEditableFolder,
} from 'test/utils';

import { FolderSelector } from './FolderSelector';
import { useFolderSelection } from './FolderSelector.hooks';

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

describe('useFolderSelection', () => {
  function renderFolderSelection() {
    const { Wrapper } = createWrapper();
    return renderHook(() => useFolderSelection(), { wrapper: Wrapper });
  }

  it('preselects the default folder when the user can edit it', async () => {
    const { result } = renderFolderSelection();

    await waitFor(() => expect(result.current.preselectUid).toBe(DEFAULT_FOLDER.uid));
  });

  it('preselects nothing when the default folder is read-only and several folders are editable', async () => {
    runTestWithReadOnlyDefaultFolder();

    const { result } = renderFolderSelection();

    await waitFor(() => expect(result.current.permissionsSettled).toBe(true));
    expect(result.current.preselectUid).toBeUndefined();
    expect(result.current.noStorableFolders).toBe(false);
  });

  it('preselects the only editable folder when the default folder is read-only', async () => {
    runTestWithSingleEditableFolder();

    const { result } = renderFolderSelection();

    await waitFor(() => expect(result.current.preselectUid).toBe(FOLDER_PRODUCTION.uid));
  });

  it('reports no storable folders when the user cannot edit any folder', async () => {
    runTestWithNoEditableFolders();

    const { result } = renderFolderSelection();

    await waitFor(() => expect(result.current.noStorableFolders).toBe(true));
    expect(result.current.preselectUid).toBeUndefined();
  });
});
