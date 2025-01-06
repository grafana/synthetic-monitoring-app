import React from 'react';

jest.mock(`components/SimpleMap`, () => ({
  SimpleMap: () => <div>A pretty map</div>,
}));
