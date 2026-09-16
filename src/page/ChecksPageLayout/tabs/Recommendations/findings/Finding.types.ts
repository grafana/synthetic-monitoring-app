import { Recommendation } from '../Recommendations.types';

export interface FindingProps {
  recommendation: Recommendation;
  totalCheckCount: number;
  /**
   * The only finding in its category. The category name is then already the pane heading, so
   * the panel leads with its summary instead of repeating the name, and needs no tooltip.
   */
  isSolo: boolean;
  /** The URL deep-linked to this finding. */
  isFocused?: boolean;
  onDismiss: () => void;
}
