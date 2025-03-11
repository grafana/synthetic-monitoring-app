import { formatDuration, getRandomProbes, pascalCaseToSentence } from 'utils';

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

describe(`formatDuration`, () => {
  describe(`short`, () => {
    it(`formats duration for a single second`, () => {
      expect(formatDuration(1000, true)).toBe('1s');
    });

    it(`formats duration for multiple seconds less than 1 minute`, () => {
      expect(formatDuration(10000, true)).toBe('10s');
    });

    it(`formats duration for a minute`, () => {
      expect(formatDuration(60000, true)).toBe('1m');
    });

    it(`formats duration for multiple minutes less than 1 hour`, () => {
      expect(formatDuration(120000, true)).toBe('2m');
    });

    it(`formats duration for a minute and a second`, () => {
      expect(formatDuration(61000, true)).toBe('1m 1s');
    });

    it(`formats duration for an hour`, () => {
      expect(formatDuration(3600000, true)).toBe('1h');
    });

    it(`formats duration for multiple hours less than 1 day`, () => {
      expect(formatDuration(7200000, true)).toBe('2h');
    });

    it(`formats duration for an hour and a minute`, () => {
      expect(formatDuration(3660000, true)).toBe('1h 1m');
    });

    it(`formats duration for an hour and a minute and a second`, () => {
      expect(formatDuration(3661000, true)).toBe('1h 1m 1s');
    });
  });

  describe(`long`, () => {
    it(`formats duration for a single second`, () => {
      expect(formatDuration(1000)).toBe('1 second');
    });

    it(`formats duration for multiple seconds less than 1 minute`, () => {
      expect(formatDuration(10000)).toBe('10 seconds');
    });

    it(`formats duration for a minute`, () => {
      expect(formatDuration(60000)).toBe('1 minute');
    });

    it(`formats duration for multiple minutes less than 1 hour`, () => {
      expect(formatDuration(120000)).toBe('2 minutes');
    });

    it(`formats duration for a minute and a second`, () => {
      expect(formatDuration(61000)).toBe('1 minute 1 second');
    });

    it(`formats duration for an hour`, () => {
      expect(formatDuration(3600000)).toBe('1 hour');
    });

    it(`formats duration for multiple hours less than 1 day`, () => {
      expect(formatDuration(7200000)).toBe('2 hours');
    });

    it(`formats duration for an hour and a minute`, () => {
      expect(formatDuration(3660000)).toBe('1 hour 1 minute');
    });

    it(`formats duration for an hour and a minute and a second`, () => {
      expect(formatDuration(3661000)).toBe('1 hour 1 minute 1 second');
    });

    it(`formats duration for multiple minutes and seconds`, () => {
      expect(formatDuration(121000)).toBe('2 minutes 1 second');
    });

    it(`formats duration for multiple hours and minutes`, () => {
      expect(formatDuration(7260000)).toBe('2 hours 1 minute');
    });

    it(`formats duration for multiple hours and minutes and seconds`, () => {
      expect(formatDuration(7261000)).toBe('2 hours 1 minute 1 second');
    });
  });
});
