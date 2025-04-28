import { secretSchemaFactory } from './secretSchema';

describe('secretSchema', () => {
  describe('create entity schema', () => {
    const validSecret = {
      name: 'a-valid-secret-name',
      description: 'A valid description',
      plaintext: 'A valid plaintext value',
      labels: [{ name: 'env', value: 'prod' }],
    };

    const secretSchema = secretSchemaFactory(true);

    it('should validate a valid secret', () => {
      expect(() => secretSchema.parse(validSecret)).not.toThrow();
    });

    describe('name', () => {
      it('should fail if name is empty', () => {
        const invalidSecret = { ...validSecret, name: '' };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/name is required/i);
      });

      it.each([
        ['123', 'valid'],
        ['abc', 'valid'],
        ['-ab', 'invalid'],
        [' ab', 'invalid'],
        ['_ab', 'invalid'],
        ['.ab', 'invalid'],
      ])("should validate first character in '%s' as %s", (name, expected) => {
        const subject = { ...validSecret, name };
        if (expected === 'valid') {
          expect(() => secretSchema.parse(subject)).not.toThrow();
        } else {
          expect(() => secretSchema.parse(subject)).toThrow(
            /name must start with a letter or number and can only contain letters, numbers, dashes, and periods/i
          );
        }
      });

      it('should fail if name is too long', () => {
        const invalidSecret = { ...validSecret, name: 'a'.repeat(256) };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/name cannot be more than 253 characters/i);
      });
    });

    describe('description', () => {
      it('should fail if description is empty', () => {
        const invalidSecret = { ...validSecret, description: '' };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/description is required/i);
      });

      it('should fail if description is too long', () => {
        const invalidSecret = { ...validSecret, description: 'a'.repeat(256) };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/description cannot be more than 253 characters/i);
      });
    });

    describe("plaintext (aka 'value')", () => {
      it('should fail if plaintext is missing', () => {
        const invalidSecret = { ...validSecret, plaintext: undefined };
        expect(() => secretSchema.parse(invalidSecret)).toThrow();
      });
      it('should fail if plaintext is empty', () => {
        const invalidSecret = { ...validSecret, plaintext: '' };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/value is required/i);
      });

      it("should not fail if plaintext is 'too long' (arbitrary value)", () => {
        const invalidSecret = { ...validSecret, plaintext: 'a'.repeat(4000) };
        expect(() => secretSchema.parse(invalidSecret)).not.toThrow();
      });
    });

    describe('labels', () => {
      it('should fail if labels are not an array', () => {
        const invalidSecret = { ...validSecret, labels: 'not-an-array' };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/expected array, received string/i);
      });

      it.each([
        ['123', 'valid'],
        ['abc', 'valid'],
        ['-ab', 'invalid'],
        [' ab', 'invalid'],
        ['_ab', 'invalid'],
        ['.ab', 'invalid'],
      ])("should validate first character in label name/value '%s' as %s\"", (keyValue, expected) => {
        const nameSubject = { ...validSecret, labels: [{ name: keyValue, value: 'prod' }] };
        const valueSubject = { ...validSecret, labels: [{ name: 'env', value: keyValue }] };
        if (expected === 'valid') {
          expect(() => secretSchema.parse(nameSubject)).not.toThrow();
          expect(() => secretSchema.parse(valueSubject)).not.toThrow();
        } else {
          expect(() => secretSchema.parse(nameSubject)).toThrow(
            /label name must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
          );
          expect(() => secretSchema.parse(valueSubject)).toThrow(
            /label value must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
          );
        }
      });

      it.each([
        ['1-_.ab', 'valid'],
        ['1-_.ab ', 'invalid'],
        ['1-_.ab?', 'invalid'],
        ['1-_.ab!', 'invalid'],
        ['1-_.ab@', 'invalid'],
        ['1-_.abå', 'invalid'],
      ])("should validate label name/value '%s' as %s", (keyValue, expected) => {
        if (expected === 'valid') {
          expect(() =>
            secretSchema.parse({ ...validSecret, labels: [{ name: keyValue, value: 'prod' }] })
          ).not.toThrow();
          expect(() =>
            secretSchema.parse({ ...validSecret, labels: [{ name: 'env', value: keyValue }] })
          ).not.toThrow();
        } else {
          expect(() => secretSchema.parse({ ...validSecret, labels: [{ name: keyValue, value: 'prod' }] })).toThrow(
            /label name must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
          );
          expect(() => secretSchema.parse({ ...validSecret, labels: [{ name: 'env', value: keyValue }] })).toThrow(
            /label value must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
          );
        }
      });

      it('should fail if a label is missing a name or value', () => {
        const emptyLabelName = { ...validSecret, labels: [{ name: '', value: 'true' }] };
        expect(() => secretSchema.parse(emptyLabelName)).toThrow(
          /label name must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
        );

        const emptyLabelValue = { ...validSecret, labels: [{ name: 'env', value: '' }] };
        expect(() => secretSchema.parse(emptyLabelValue)).toThrow(
          /label value must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods/i
        );
      });

      it('should fail if a label name is too long', () => {
        const invalidSecret = { ...validSecret, labels: [{ name: 'a'.repeat(256), value: 'value' }] };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/label name cannot be more than 63 characters/i);
      });

      it('should fail if a label value is too long', () => {
        const invalidSecret = { ...validSecret, labels: [{ name: 'name', value: 'a'.repeat(256) }] };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/label value cannot be more than 63 characters/i);
      });

      it('should fail if a label name is not unique', () => {
        const invalidSecret = {
          ...validSecret,
          labels: [
            { name: 'env', value: 'prod' },
            { name: 'env', value: 'staging' },
          ],
        };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/label name must be unique/i);
      });

      it('should fail if there are more than 10 labels', () => {
        const invalidSecret = {
          ...validSecret,
          labels: Array.from({ length: 11 }, (_, i) => ({ name: `label${i}`, value: `value${i}` })),
        };
        expect(() => secretSchema.parse(invalidSecret)).toThrow(/You can add up to 10 labels/i);
      });

      it('should allow an empty labels array', () => {
        const validSecretWithEmptyLabels = { ...validSecret, labels: [] };
        expect(() => secretSchema.parse(validSecretWithEmptyLabels)).not.toThrow();
      });
    });

    describe('update entity schema', () => {
      const validSecrets = [
        {
          uuid: '123',
          description: 'A valid description',
          labels: [{ name: 'env', value: 'prod' }],
        },
        {
          uuid: '123',
          description: 'A valid description',
          labels: [{ name: 'env', value: 'prod' }],
          plaintext: 'A valid plaintext value',
        },
      ];

      const secretSchema = secretSchemaFactory(false);
      it.each(validSecrets)('should validate a valid secret', (secret) => {
        expect(() => secretSchema.parse(secret)).not.toThrow();
      });
    });
  });
});
