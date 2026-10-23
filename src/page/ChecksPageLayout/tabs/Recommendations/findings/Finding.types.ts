import { Recommendation } from '../Recommendations.types';

import { FindingFilter } from '../Recommendations.filters';

export interface FindingProps {
  recommendation: Recommendation;
  totalCheckCount: number;
  /** The only finding in its category, so the panel leads with its summary and skips the tooltip. */
  isSolo: boolean;
  /** Deep-linked to from the URL. */
  isFocused?: boolean;
  /** The rail's filters. The panel narrows its own rows, so it still knows its unfiltered total. */
  filter: FindingFilter;
  onDismiss: () => void;
}
