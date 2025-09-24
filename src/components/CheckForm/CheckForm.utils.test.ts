import { getAdditionalDuration } from 'components/CheckForm/CheckForm.utils';

function minutesToMilliseconds(minutes: number) {
  return minutes * 60 * 1000;
}

describe(`getAdditionalDuration`, () => {
  it(`should return the correct duration`, () => {
    const TEN_SECONDS = 10000;

    expect(getAdditionalDuration(TEN_SECONDS, 6)).toBe(minutesToMilliseconds(1));
    expect(getAdditionalDuration(TEN_SECONDS, 12)).toBe(minutesToMilliseconds(2));
    expect(getAdditionalDuration(TEN_SECONDS, 18)).toBe(minutesToMilliseconds(3));
  });

  it(`rounds down to the nearest minute`, () => {
    const TEN_SECONDS = 10000;

    expect(getAdditionalDuration(TEN_SECONDS, 5)).toBe(0);
    expect(getAdditionalDuration(TEN_SECONDS, 11)).toBe(minutesToMilliseconds(1));
    expect(getAdditionalDuration(TEN_SECONDS, 17)).toBe(minutesToMilliseconds(2));
  });
});
