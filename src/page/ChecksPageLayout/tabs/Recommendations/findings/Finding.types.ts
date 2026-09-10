import { Recommendation } from '../Recommendations.types';

export interface FindingProps {
  recommendation: Recommendation;
  totalCheckCount: number;
  onDismiss: () => void;
}
