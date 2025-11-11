import { trackLinkClick } from 'features/tracking/linkEvents';

import { TRACKING_LINK_CNT, TRACKING_LINK_SRC } from 'components/DocsLink/DocsLink.constants';

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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse URL', { url, error });
    }

    return null;
  }
}

// data and analytics use these params to track link clicks so we can measure how successful they are
// https://raintank-corp.slack.com/archives/C020988GK4H/p1762769000872869
export function appendTrackingParams(href: string) {
  try {
    const url = new URL(href);
    url.searchParams.set('src', TRACKING_LINK_SRC);
    url.searchParams.set('cnt', TRACKING_LINK_CNT);

    return url.toString();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to append tracking params', { href, error });
    }

    return href;
  }
}
