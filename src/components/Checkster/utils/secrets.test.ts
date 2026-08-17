import { buildSecretRef, isSecretRef, parseSecretName } from './secrets';

describe('isSecretRef', () => {
  it.each([
    ['${secrets.my-token}', true],
    ['prefix ${secrets.db-password} suffix', true],
    ['${secrets.a}', true],
    ['plain-value', false],
    ['', false],
    ['${vars.something}', false],
    [undefined, false],
  ])('isSecretRef(%p) === %p', (value, expected) => {
    expect(isSecretRef(value as string | undefined)).toBe(expected);
  });
});

describe('parseSecretName', () => {
  it('extracts the secret name', () => {
    expect(parseSecretName('${secrets.my-token}')).toBe('my-token');
  });

  it('returns undefined for a non-reference', () => {
    expect(parseSecretName('plain')).toBeUndefined();
    expect(parseSecretName(undefined)).toBeUndefined();
  });
});

describe('buildSecretRef', () => {
  it('builds a reference from a name', () => {
    expect(buildSecretRef('my-token')).toBe('${secrets.my-token}');
  });

  it('round-trips with parseSecretName', () => {
    expect(parseSecretName(buildSecretRef('some-name'))).toBe('some-name');
  });
});
