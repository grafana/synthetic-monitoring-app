import { Recommendation } from '../Recommendations.types';

export interface FindingProps {
  recommendation: Recommendation;
  totalCheckCount: number;
  /** The only finding in its category, so the panel leads with its summary and skips the tooltip. */
  isSolo: boolean;
  /** Deep-linked to from the URL. */
  isFocused?: boolean;
  onDismiss: () => void;
}
