import React from 'react';

import { DocsLink } from 'components/DocsLink';
import { Ul } from 'components/Ul';

interface DocumentationLinksProps {
  links: Array<{ title: string; href: string }>;
  source: string;
}

export function DocumentationLinks({ links, source }: DocumentationLinksProps) {
  return (
    <Ul>
      {links.map((link) => (
        <li key={link.href}>
          <DocsLink href={link.href} source={source}>
            {link.title}
          </DocsLink>
        </li>
      ))}
    </Ul>
  );
}
