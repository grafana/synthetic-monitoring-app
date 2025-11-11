import React, { type ReactNode, useCallback } from 'react';
import { TextLink } from '@grafana/ui';

import { appendTrackingParams, onDocsLinkClick } from 'components/DocsLink/DocsLink.utils';

type DocsLinkProps = {
  children: ReactNode;
  href: string;
  inline?: boolean;
  /** Where in the app the link was clicked from */
  source: string;
};

export const DocsLink = ({ children, href, source }: DocsLinkProps) => {
  const trackingHref = appendTrackingParams(href);

  const handleClick = useCallback(() => {
    onDocsLinkClick(trackingHref, source);
  }, [trackingHref, source]);

  return (
    // todo: replace this with something more customisable
    <TextLink href={trackingHref} external onClick={handleClick}>
      {children}
    </TextLink>
  );
};
