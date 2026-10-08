import React, { ReactNode } from 'react';
import { Grid } from '@grafana/ui';

interface ChoiceTileGridProps {
  /** `ChoiceTile`s, which render as the list's items. */
  children: NonNullable<ReactNode>;
}

export function ChoiceTileGrid({ children }: ChoiceTileGridProps) {
  return (
    <Grid role="list" columns={{ xs: 1, md: 2, lg: 3 }} gap={1.5}>
      {children}
    </Grid>
  );
}
