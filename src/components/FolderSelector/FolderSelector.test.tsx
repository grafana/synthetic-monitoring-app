import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { DEFAULT_FOLDER, FOLDER_READONLY, FOLDER_ROOT, FOLDER_ROOT_CHILD } from 'test/fixtures/folders';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { FolderSelector } from './FolderSelector';

// The folder picker itself is Grafana core's nested folder picker, mocked in
// the runtime mock as a native select (labelled "Folder picker") backed by
// the same MSW folders API, including server-side permission filtering.
describe('FolderSelector', () => {
  it('renders the folder picker and auto-selects the default folder', async () => {
    const onChange = jest.fn();
    render(<FolderSelector onChange={onChange} />);

    expect(await screen.findByLabelText('Folder picker')).toBeInTheDocument();
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(DEFAULT_FOLDER.uid));
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
    const { user } = render(<FolderSelector onChange={onChange} autoSelectDefault={false} />);

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
