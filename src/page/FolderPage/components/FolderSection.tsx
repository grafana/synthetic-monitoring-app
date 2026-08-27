import React, { ReactNode } from 'react';
import { Box, Text } from '@grafana/ui';

interface FolderSectionProps {
  title?: string;
  children: ReactNode;
}

/**
 * Shared card chrome for the folder dashboard sections, built from
 * @grafana/ui layout primitives (design tokens) instead of hand-rolled css.
 */
export const FolderSection = ({ title, children }: FolderSectionProps) => (
  <Box
    backgroundColor="secondary"
    borderStyle="solid"
    borderColor="weak"
    borderRadius="default"
    paddingX={2}
    paddingY={1.5}
  >
    {title && (
      <Box marginBottom={1}>
        <Text element="h3" variant="bodySmall" color="secondary" weight="medium">
          {title}
        </Text>
      </Box>
    )}
    {children}
  </Box>
);
