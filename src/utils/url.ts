export function stripQuery(url: string): string {
  const index = url.search(/[?#]/);

  return index === -1 ? url : url.slice(0, index);
}
