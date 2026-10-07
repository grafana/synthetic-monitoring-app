import { Check } from 'types';

export function getAvailableCheckName(
  check: Pick<Check, 'job' | 'target'>,
  existingChecks: Array<Pick<Check, 'job' | 'target'>>,
  conflictingNames: ReadonlySet<string> = new Set()
): string {
  const names = new Set([
    ...existingChecks.filter(({ target }) => target === check.target).map(({ job }) => job),
    ...conflictingNames,
  ]);
  const base = check.job.slice(0, 128);
  let job = base;
  for (let index = 2; names.has(job); index++) {
    const suffix = ` (${index})`;
    job = base.slice(0, 128 - suffix.length) + suffix;
  }
  return job;
}
