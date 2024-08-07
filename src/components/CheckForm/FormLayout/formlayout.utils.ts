import { useCallback, useState } from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';
import { uniq } from 'lodash';
import { ZodType } from 'zod';

// because we have separated multihttp assertions we need a way to say that no matter the
// entry's index this error belongs to the steps section or the uptime definition step
// so we have to wildcard the entry index in form errors
// -1 works well because it is type safe as it is a number but it is also impossible to be a valid index
export const ENTRY_INDEX_CHAR = `-1`;

export function useFormLayout(disabled?: boolean) {
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const setVisited = useCallback(
    (visited: number[]) => {
      if (!disabled) {
        setVisitedSections((prev) => uniq([...prev, ...visited]));
      }
    },
    [disabled]
  );

  const goToSection = useCallback(
    (index: number) => {
      setActiveSection(index);
      const previous = new Array(index).fill(0).map((_, i) => i);
      setVisited(previous);
    },
    [setVisited]
  );

  return {
    activeSection,
    goToSection,
    setActiveSection,
    setVisited,
    visitedSections,
  };
}

export function checkForErrors<T extends FieldValues>({
  fields = [],
  values,
  schema,
}: {
  values: T;
  fields: Array<FieldPath<T>>;
  schema: ZodType<T>;
}) {
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = result.error.errors.reduce<string[]>((acc, err) => {
      const path = err.path.map((e) => (typeof e === 'number' ? ENTRY_INDEX_CHAR : e)).join('.');
      const isRelevant = fields.some((f) => path.startsWith(f));

      if (isRelevant) {
        return [...acc, path];
      }

      return acc;
    }, []);
    return {
      errors,
    };
  }

  return {
    errors: [],
  };
}

export function normalizeFlattenedErrors(errors: string[]) {
  return errors.map((error) => {
    if (error.startsWith(`settings.multihttp.entries`)) {
      return error.replace(/\.[0-9]\./, `.${ENTRY_INDEX_CHAR}.`);
    }

    return error;
  });
}
