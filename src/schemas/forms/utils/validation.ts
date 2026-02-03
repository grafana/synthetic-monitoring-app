import { RefinementCtx } from 'zod';

export const noLeadingTrailingWhitespace = (subjectName: string) => {
  return (value: string, ctx: RefinementCtx) => {
    if (value !== value.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: `${subjectName} cannot have leading or trailing whitespace`,
      });
    }
  };
};
