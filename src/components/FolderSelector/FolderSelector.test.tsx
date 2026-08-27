import React from 'react';
import { renderHook, screen, waitFor, within } from '@testing-library/react';
import { DEFAULT_FOLDER, FOLDER_READONLY, FOLDER_ROOT, FOLDER_ROOT_CHILD } from 'test/fixtures/folders';
import { apiRoute, getServerRequests } from 'test/handlers';
import { createWrapper, render } from 'test/render';
import { server } from 'test/server';
import { runTestAsSMEditor, runTestWithForbiddenDefaultFolder, runTestWithReadOnlyDefaultFolder } from 'test/utils';

import { FolderSelector } from './FolderSelector';
import { useFolderSelection } from './FolderSelector.hooks';

// The folder picker itself is Grafana core's nested folder picker, mocked in
// the runtime mock as a native select (labelled "Folder picker") backed by
// the same MSW folders API, including server-side permission filtering.
describe('FolderSelector', () => {
  it('renders the folder picker without selecting anything by itself', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByLabelText('Folder picker')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the create folder button', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByRole('button', { name: /Create folder/ })).toBeInTheDocument();
  });

  it('renders a read-only input without the create button when disabled', async () => {
    const onChange = jest.fn();
    render(<FolderSelector value={FOLDER_ROOT.uid} onChange={onChange} disabled />);

    expect(await screen.findByDisplayValue(FOLDER_ROOT.title)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Create folder/ })).not.toBeInTheDocument();
  });

  it('offers any editable folder as an assignable option, including subfolders of root folders', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    const picker = await screen.findByLabelText('Folder picker');
    expect(await within(picker).findByRole('option', { name: FOLDER_ROOT.title })).toBeInTheDocument();
    expect(within(picker).getByRole('option', { name: FOLDER_ROOT_CHILD.title })).toBeInTheDocument();
  });

  it('does not offer folders the user cannot edit (server-side permission filtering)', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    const picker = await screen.findByLabelText('Folder picker');
    await within(picker).findByRole('option', { name: FOLDER_ROOT.title });
    expect(within(picker).queryByRole('option', { name: FOLDER_READONLY.title })).not.toBeInTheDocument();
  });

  it('assigns the folder selected in the picker', async () => {
    const onChange = jest.fn();
    const { user } = render(<FolderSelector onChange={onChange} />);

    const picker = await screen.findByLabelText('Folder picker');
    await within(picker).findByRole('option', { name: FOLDER_ROOT_CHILD.title });
    await user.selectOptions(picker, FOLDER_ROOT_CHILD.uid);

    expect(onChange).toHaveBeenCalledWith(FOLDER_ROOT_CHILD.uid);
  });

  it('creates a folder at the root level when Dashboards is selected as the parent', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`createFolder`, {}, record));

    const onChange = jest.fn();
    const { user } = render(<FolderSelector onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: /Create folder/ }));

    const modal = await screen.findByRole('dialog');
    const parentPicker = within(modal).getByLabelText('Folder picker');
    await within(parentPicker).findByRole('option', { name: 'Dashboards' });
    await user.selectOptions(parentPicker, '');

    await user.type(within(modal).getByPlaceholderText('Enter folder name'), 'My Root Folder');
    await user.click(within(modal).getByRole('button', { name: 'Create' }));

    const { body } = await read();
    expect(body).toEqual({ title: 'My Root Folder' });
  });

  // The default folder only supplies the create-folder modal's preselected
  // parent, so failing to read it must not block assignment: a user with a
  // grant on a team folder still needs somewhere to put their checks.
  it('still offers folder assignment when the default folder is forbidden', async () => {
    runTestWithForbiddenDefaultFolder();

    const onChange = jest.fn();
    const { user } = render(<FolderSelector onChange={onChange} />);

    const picker = await screen.findByLabelText('Folder picker');
    await within(picker).findByRole('option', { name: FOLDER_ROOT.title });
    await user.selectOptions(picker, FOLDER_ROOT.uid);

    expect(onChange).toHaveBeenCalledWith(FOLDER_ROOT.uid);
    expect(screen.queryByText('Unable to load folders')).not.toBeInTheDocument();
  });

  it('requires an explicit parent for a new folder when the default folder is forbidden', async () => {
    runTestWithForbiddenDefaultFolder();

    const { user } = render(<FolderSelector onChange={jest.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Create folder/ }));

    const modal = await screen.findByRole('dialog');
    await user.type(within(modal).getByPlaceholderText('Enter folder name'), 'Team folder');

    // Nothing is preselected, so a name alone is not enough to create
    expect(within(modal).getByRole('button', { name: 'Create' })).toBeDisabled();

    const parentPicker = within(modal).getByLabelText('Folder picker');
    await within(parentPicker).findByRole('option', { name: FOLDER_ROOT.title });
    await user.selectOptions(parentPicker, FOLDER_ROOT.uid);

    expect(within(modal).getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  // A readable default folder is not enough to preselect it as the parent:
  // the user must be able to save into it, otherwise Create would enable
  // with a parent the API is going to reject.
  it('preselects no parent for a new folder when the default folder is read-only', async () => {
    runTestWithReadOnlyDefaultFolder();

    const { user } = render(<FolderSelector onChange={jest.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Create folder/ }));

    const modal = await screen.findByRole('dialog');
    await user.type(within(modal).getByPlaceholderText('Enter folder name'), 'Team folder');

    expect(within(modal).getByRole('button', { name: 'Create' })).toBeDisabled();

    const parentPicker = within(modal).getByLabelText('Folder picker');
    await within(parentPicker).findByRole('option', { name: FOLDER_ROOT.title });
    await user.selectOptions(parentPicker, FOLDER_ROOT.uid);

    expect(within(modal).getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('hides the create folder button without org-level folder creation rights', async () => {
    runTestAsSMEditor();

    const { user } = render(<FolderSelector onChange={jest.fn()} />);

    const picker = await screen.findByLabelText('Folder picker');
    await within(picker).findByRole('option', { name: FOLDER_ROOT.title });
    await user.selectOptions(picker, FOLDER_ROOT.uid);

    expect(screen.queryByRole('button', { name: /Create folder/ })).not.toBeInTheDocument();
  });

  it('creates a folder inside another folder picked as the parent', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`createFolder`, {}, record));

    const onChange = jest.fn();
    const { user } = render(<FolderSelector onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: /Create folder/ }));

    const modal = await screen.findByRole('dialog');
    const parentPicker = within(modal).getByLabelText('Folder picker');
    await within(parentPicker).findByRole('option', { name: FOLDER_ROOT.title });
    await user.selectOptions(parentPicker, FOLDER_ROOT.uid);

    await user.type(within(modal).getByPlaceholderText('Enter folder name'), 'Nested Folder');
    await user.click(within(modal).getByRole('button', { name: 'Create' }));

    const { body } = await read();
    expect(body).toEqual({ title: 'Nested Folder', parentUid: FOLDER_ROOT.uid });
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

  it('preselects nothing when the user cannot edit the default folder', async () => {
    runTestWithReadOnlyDefaultFolder();

    const { result } = renderFolderSelection();

    await waitFor(() => expect(result.current.isPreselectReady).toBe(true));
    expect(result.current.preselectUid).toBeUndefined();
  });
});
