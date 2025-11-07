import React, { type ReactNode, useCallback } from 'react';
import { TextLink } from '@grafana/ui';

import { onDocsLinkClick } from 'components/DocsLink/DocsLink.utils';

type DocsLinkProps = {
  children: ReactNode;
  href: string;
  inline?: boolean;
  source: string;
};

export const DocsLink = ({ children, href, source }: DocsLinkProps) => {
  const handleClick = useCallback(() => {
    onDocsLinkClick(href, source);
  }, [href, source]);

  return (
    // todo: replace this with something more customisable
    <TextLink href={href} external onClick={handleClick}>
      {children}
    </TextLink>
  );
};
