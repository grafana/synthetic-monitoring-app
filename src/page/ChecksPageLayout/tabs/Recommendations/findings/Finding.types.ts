import { Recommendation } from '../Recommendations.types';

export interface FindingProps {
  recommendation: Recommendation;
  totalCheckCount: number;
  /** The URL deep-linked to this finding. */
  isFocused?: boolean;
  onDismiss: () => void;
}
