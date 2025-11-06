import React from 'react';
import { TextLink } from '@grafana/ui';

import { Ul } from 'components/Ul';

interface DocumentationLinksProps {
  links: Array<{ title: string; href: string }>;
}

export function DocumentationLinks({ links }: DocumentationLinksProps) {
  return (
    <Ul>
      {links.map((link) => (
        <li key={link.href}>
          <TextLink href={link.href} external>
            {link.title}
          </TextLink>
        </li>
      ))}
    </Ul>
  );
}
