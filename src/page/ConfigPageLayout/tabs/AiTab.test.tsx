import React from 'react';
import { render } from 'test/render';

import { AiTab } from './AiTab';

it('renders the AI check failure explanations setting', async () => {
  const { findByText, findByRole } = render(<AiTab />);

  expect(await findByText('AI features')).toBeInTheDocument();
  expect(await findByText('Check failure explanations')).toBeInTheDocument();
  expect(await findByRole('switch')).toBeInTheDocument();
});
