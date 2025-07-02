export type UserJourney = {
  title: string;
  description: string;
  success: boolean;
  steps: UserJourneyStep[];
};

export type UserJourneyStep = {
  url: string;
  reasoning: string;
};

export type UserJourneyTableRow = {
  stepIndex: number;
  title: string;
  description: string;
  success: boolean;
  url: string;
  reasoning: string;
};

export type NodeData = {
  url: string;
  title: string;
  page_insights: {
    score: number;
    insights_by_category: Record<InsightsCategory, PageInsightsCategory>;
  };
};

export type InsightsCategory = 'accessibility' | 'content' | 'reliability';

export type PageInsightsCategory = {
  summary: string;
  score: number;
  issues: PageInsightsIssue[];
};

export type PageInsightsIssue = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reason: string;
  recommendation: string;
};

export type PageInsightsTableRow = {
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reason: string;
  recommendation: string;
};
