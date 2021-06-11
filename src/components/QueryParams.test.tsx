import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryParams from './QueryParams';

const onChange = jest.fn();

beforeEach(() => {
  onChange.mockReset();
});

test('Shows empty inputs if no query params', async () => {
  const target = new URL('http://example.com');
  render(<QueryParams target={target} onChange={onChange} />);
  const queryNameInput = await screen.findByPlaceholderText('Key');
  const queryValueInput = await screen.findByPlaceholderText('Value');
  expect(queryNameInput).toBeInTheDocument();
  expect(queryValueInput).toBeInTheDocument();
});

test('Should handle initial value', async () => {
  const target = new URL('http://example.com?test=1&another=tacos');
  render(<QueryParams target={target} onChange={onChange} />);
  const inputs = (await screen.findAllByRole('textbox')) as HTMLInputElement[];
  expect(inputs.length).toBe(4);
  const expectedValues = ['test', '1', 'another', 'tacos'];
  inputs.forEach((input) => {
    expect(expectedValues.includes(input.value)).toBe(true);
  });
});

test('Returns a query string onChange', async () => {
  const target = new URL('http://example.com');
  render(<QueryParams target={target} onChange={onChange} />);
  const queryNameInput = await screen.findByPlaceholderText('Key');
  await userEvent.paste(queryNameInput, 'queryName');
  const queryValueInput = await screen.findByPlaceholderText('Value');
  await userEvent.paste(queryValueInput, 'queryValue');
  expect(onChange).toHaveBeenLastCalledWith('http://example.com/?queryName=queryValue');
});

test('Delete button deletes a query param', async () => {
  const target = new URL('https://example.com?robert=bob&stephen=steve&jim=james');
  render(<QueryParams target={target} onChange={onChange} />);
  const buttons = await screen.findAllByRole('button');
  userEvent.click(buttons[1]);
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(onChange).toHaveBeenCalledWith('https://example.com/?robert=bob&jim=james');
});
