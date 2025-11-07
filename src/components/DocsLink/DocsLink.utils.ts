import { trackLinkClick } from 'features/tracking/linkEvents';

export function onDocsLinkClick(href: string, source: string) {
  const parsedUrl = parseUrl(href);

  if (!parsedUrl) {
    return;
  }

  trackLinkClick({
    href,
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    search: parsedUrl.search,
    source,
  });
}

function parseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return {
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
    };
  } catch (error) {
    return null;
  }
}
