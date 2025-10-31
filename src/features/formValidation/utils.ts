import { FieldError, FieldErrors, FieldValues, ResolverResult } from 'react-hook-form';
import { ZodError, ZodType } from 'zod';

// Custom resolver for useForm()
// https://github.com/react-hook-form/react-hook-form/issues/12816#issuecomment-2883941680
export function customZodResolver<T extends FieldValues>(schema: ZodType) {
  return async (values: FieldValues): Promise<ResolverResult<T>> => {
    try {
      const result = await schema.safeParseAsync(values);

      if (result.success) {
        return {
          values: result.data as T, // todo: fix this
          errors: {},
        };
      } else {
        return {
          values: {},
          errors: zodToHookFormErrors<T>(result.error),
        };
      }
    } catch (error) {
      console.error('Resolver error: ', error);
      return {
        values: {},
        errors: {
          root: {
            type: 'unknown',
            message: 'An unknown error occurred during validation',
          } as FieldError,
        } as FieldErrors<T>,
      };
    }
  };
}

// Utility to convert ZodError to Hook Form-compatible FieldErrors
function zodToHookFormErrors<T extends FieldValues>(zodError: ZodError): FieldErrors<T> {
  const errors: FieldErrors = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || 'root';
    errors[path] = {
      type: issue.code,
      message: issue.message,
    } as FieldError;
  }

  return errors as FieldErrors<T>;
}
