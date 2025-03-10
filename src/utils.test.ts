import { getRandomProbes, pascalCaseToSentence } from 'utils';

it('gets random probes', async () => {
  const probes = [11, 23, 5, 5212, 43, 3, 4, 6];
  const random = getRandomProbes(probes, 4);
  expect(random.length).toBe(4);

  random.forEach((randomId) => {
    const found = probes.findIndex((probeId) => probeId === randomId);
    expect(found).toBeGreaterThan(-1);
  });

  const random2 = getRandomProbes(probes, 2);
  expect(random2.length).toBe(2);
});

describe(`pascalCaseToSentence`, () => {
  it(`converts camelCase to sentence`, () => {
    expect(pascalCaseToSentence('camelCaseToSentence')).toBe('Camel Case To Sentence');
  });

  it(`converts pascalCase to sentence`, () => {
    expect(pascalCaseToSentence('PascalCaseToSentence')).toBe('Pascal Case To Sentence');
  });

  it(`doesn't convert values which are all uppercase`, () => {
    expect(pascalCaseToSentence('ALLUPPERCASE')).toBe('ALLUPPERCASE');
  });

  it(`doesn't convert values which are all lowercase`, () => {
    expect(pascalCaseToSentence('alllowercase')).toBe('alllowercase');
  });

  it(`doesn't convert values which already have spaces`, () => {
    expect(pascalCaseToSentence('Has Spaces')).toBe('Has Spaces');
  });
});
