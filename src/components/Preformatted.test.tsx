// @ts-ignore
import React from 'react';
import { render, screen, within } from '@testing-library/react';

// @ts-ignore
import { Preformatted } from './Preformatted';

describe('Preformatted', () => {
  it('should render content within a pre tag', async () => {
    const sampleContent = '__sample_content__';
    render(<Preformatted>{sampleContent}</Preformatted>);
    const pre = screen.queryByText(sampleContent);

    expect(pre).toBeInTheDocument();
  });

  it('should render content within a pre tag, within a code tag', async () => {
    const sampleContent = '__sample_content__';
    render(<Preformatted isCode>{sampleContent}</Preformatted>);
    const pre = screen.queryByText(sampleContent, { selector: 'code' });

    expect(pre).toBeInTheDocument();
  });

  it.each([
    {
      highlight: '__sample__',
      content: `This is a __sample__ content.`, // Note: 'This' is used to find the pre tag
      expectedLength: 1,
    },
    {
      highlight: '__target__',
      content: `This should highlight __target__ and __target__`, // Note: 'This' is used to find the pre tag
      expectedLength: 2,
    },
  ])(
    'should take string as highlight prop ($expectedLength counts)',
    async ({ highlight, content, expectedLength }) => {
      render(<Preformatted highlight={highlight}>{content}</Preformatted>);

      const pre = screen.getByText(/^This/, { selector: 'pre' });
      expect(pre).toBeInTheDocument();
      const highlighted = pre && within(pre).queryAllByText(highlight, { selector: 'strong' });
      expect(highlighted).toHaveLength(expectedLength);
    }
  );

  it.each([
    {
      highlight: ['__sample__'],
      content: `This should replace __sample__`, // Note: 'This' is used to find the pre tag
      expectedLength: 1,
    },
    {
      highlight: ['__sample__', '__target__'],
      content: `This should replace __sample__ and __target__`, // Note: 'This' is used to find the pre tag
      expectedLength: 2,
    },
    {
      highlight: ['__sample__', '__target__', '__another__'],
      content: `This should replace __sample__, __another__ and __target__`, // Note: 'This' is used to find the pre tag
      expectedLength: 3,
    },
  ])('should take array as highlight prop ($expectedLength counts)', async ({ highlight, content, expectedLength }) => {
    render(<Preformatted highlight={highlight}>{content}</Preformatted>);

    const pre = screen.getByText(/^This/, { selector: 'pre' });
    expect(pre).toBeInTheDocument();

    const count = highlight.reduce((acc, word) => {
      const match = pre && within(pre).queryAllByText(word, { selector: 'strong' });
      return acc + match.length;
    }, 0);

    expect(count).toBe(expectedLength);
  });
});
