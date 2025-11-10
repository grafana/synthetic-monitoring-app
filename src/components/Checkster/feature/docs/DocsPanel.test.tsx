import React from 'react';
import { screen } from '@testing-library/dom';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { Checkster } from 'components/Checkster/Checkster';

describe('DocsPanel', () => {
  it('should render', async () => {
    render(<Checkster check={BASIC_HTTP_CHECK} onSave={async () => {}} />);
      expect(screen.getByText('Docs')).toBeInTheDocument();
  });
});
