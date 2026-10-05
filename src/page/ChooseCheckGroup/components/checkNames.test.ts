import { getAvailableCheckName } from './checkNames';

it('only considers name conflicts for the same target', () => {
  const check = { job: 'Detect broken links', target: 'https://grafana.com/' };
  expect(getAvailableCheckName(check, [{ ...check, target: 'https://example.com/' }])).toBe(check.job);
  expect(getAvailableCheckName(check, [check, { ...check, job: `${check.job} (2)` }])).toBe(`${check.job} (3)`);
});

it('reserves room for the suffix within the name limit, including multiple digits', () => {
  const check = { job: 'x'.repeat(128), target: 'https://grafana.com/' };
  const existing = [
    check,
    ...Array.from({ length: 8 }, (_, i) => ({ ...check, job: 'x'.repeat(124) + ` (${i + 2})` })),
  ];
  const result = getAvailableCheckName(check, existing);
  expect(result).toBe('x'.repeat(123) + ' (10)');
  expect(result).toHaveLength(128);
});
