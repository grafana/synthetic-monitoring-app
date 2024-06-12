import React from 'react';

import { Field } from '@grafana/ui';

import { PasswordField } from './PasswordField';
import { render } from 'test/render';

describe('PasswordField', () => {
  test('should render correctly', async () => {
    const { findByLabelText, getByRole } = render(
      <Field label="Password">
        <PasswordField id="password" />
      </Field>
    );

    expect(await findByLabelText('Password')).toBeInTheDocument();
    expect(await getByRole('switch', { name: 'Show password' })).toBeInTheDocument();
  });

  test('should able to show password value if clicked on password-reveal icon', async () => {
    const { user, findByLabelText, getByRole } = render(
      <Field label="Password">
        <PasswordField id="password" />
      </Field>
    );

    const passwordInput = await findByLabelText('Password');
    expect(passwordInput).toHaveProperty('type', 'password');
    await user.click(getByRole('switch', { name: 'Show password' }));
    expect(passwordInput).toHaveProperty('type', 'text');
  });
});
