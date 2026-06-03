import React, { useState } from 'react';
import { IconButton, LinkButton, Stack } from '@grafana/ui';

import { Check } from 'types';

import { KGEntityModal } from './KGEntityModal';
import { buildKGEntityGraphUrl, isKnowledgeGraphAvailable } from './knowledgeGraph';

interface ViewInKnowledgeGraphProps {
  check: Check;
}

export function ViewInKnowledgeGraph({ check }: ViewInKnowledgeGraphProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isKnowledgeGraphAvailable()) {
    return null;
  }

  const url = buildKGEntityGraphUrl(check);

  return (
    <>
      <Stack direction="row" gap={0.5} alignItems="center">
        <LinkButton
          variant="secondary"
          href={url}
          icon="external-link-alt"
          fill="text"
          target="_blank"
          tooltip="View this check and its monitored service in the Knowledge Graph"
        >
          View in Knowledge Graph
        </LinkButton>
        <IconButton
          name="sitemap"
          size="md"
          tooltip="View Knowledge Graph entity details"
          onClick={() => setIsModalOpen(true)}
        />
      </Stack>
      {isModalOpen && <KGEntityModal check={check} onDismiss={() => setIsModalOpen(false)} />}
    </>
  );
}
