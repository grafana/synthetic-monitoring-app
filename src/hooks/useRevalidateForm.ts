import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';

export function useRevalidateForm() {
  const { formState, trigger } = useFormContext();
  const hasBeenSubmitted = formState.submitCount > 0;

  return <T extends FieldValues>(path?: FieldPath<T>) => {
    if (hasBeenSubmitted) {
      trigger(path);
    }
  };
}
