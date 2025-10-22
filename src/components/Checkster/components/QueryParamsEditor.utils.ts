export function getUrlWithoutSearchAndHash(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';

    return parsed.toString();
  } catch (_error) {
    // Without a valid URL, it becomes a bit tricky
    const hashIndex = url.indexOf('#');
    const urlWithoutHash = hashIndex !== -1 ? url.substring(0, hashIndex) : url;

    const [value = ''] = urlWithoutHash.split('?');
    return value;
  }
}

export function getHashFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hash;
  } catch (error) {
    const [, hash = ''] = url.split('#');
    return hash ? `#${hash}` : '';
  }
}

function getSearchParamEntries(url: string): Array<[string, string]> {
  const search = new URL(url).search;
  const searchParams = new URLSearchParams(search);

  return Array.from(searchParams.entries());
}

export function toSearchParamEntries(url: string) {
  try {
    return getSearchParamEntries(url);
  } catch (e) {
    try {
      const firstIndexOfQuestionMark = url.indexOf('?');
      const search = firstIndexOfQuestionMark !== -1 ? url.substring(firstIndexOfQuestionMark + 1) : '';
      return getSearchParamEntries(`https://www.grafana.com?${search}`);
    } catch (e) {
      return [];
    }
  }
}
