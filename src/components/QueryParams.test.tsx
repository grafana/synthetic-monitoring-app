import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { QueryParams } from './QueryParams';

const onChange = jest.fn();

beforeEach(() => {
  onChange.mockReset();
});

function renderQueryParams(props: { target: URL; onChange: () => void }) {
  return render(
    <TestForm>
      <QueryParams {...props} />
    </TestForm>
  );
}

test('Shows empty inputs if no query params', async () => {
  const target = new URL('http://example.com');
  renderQueryParams({ target, onChange });
  const queryNameInput = await screen.findByPlaceholderText('Key');
  const queryValueInput = await screen.findByPlaceholderText('Value');
  expect(queryNameInput).toBeInTheDocument();
  expect(queryValueInput).toBeInTheDocument();
});

test('Should handle initial value', async () => {
  const target = new URL('http://example.com?test=1&another=tacos');
  renderQueryParams({ target, onChange });
  const inputs = (await screen.findAllByLabelText(/Query param/)) as HTMLInputElement[];
  expect(inputs.length).toBe(4);
  const expectedValues = ['test', '1', 'another', 'tacos'];
  inputs.forEach((input) => {
    expect(expectedValues.includes(input.value)).toBe(true);
  });
});

test('Returns a query string onChange', async () => {
  const target = new URL('http://example.com');
  const { user } = renderQueryParams({ target, onChange });
  const queryNameInput = await screen.findByPlaceholderText('Key');
  queryNameInput.focus();
  await user.paste('queryName');
  const queryValueInput = await screen.findByPlaceholderText('Value');

  queryValueInput.focus();
  await user.paste('queryValue');
  expect(onChange).toHaveBeenLastCalledWith('http://example.com/?queryName=queryValue');
});

test('Delete button deletes a query param', async () => {
  const target = new URL('https://example.com?robert=bob&stephen=steve&jim=james');
  const { user } = renderQueryParams({ target, onChange });
  const buttons = await screen.findAllByLabelText('Delete');
  await user.click(buttons[1]);
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(onChange).toHaveBeenCalledWith('https://example.com/?robert=bob&jim=james');
});

type TestFormProps = { children: ReactNode };

const TestForm = ({ children }: TestFormProps) => {
  const formMethods = useForm();

  return <FormProvider {...formMethods}>{children}</FormProvider>;
};
