export type UserJourney = {
  title: string;
  description: string;
  discovery_context: string;
};

export type UserJourneyTest = {
  user_flow: UserJourney;
  summary: string;
  success: boolean;
  final_url: string;
  steps: UserJourneyStep[];
};

export type UserJourneyStep = {
  action: string;
  goal: string;
  result: string;
  memory: string;
  url: string;
};

export type UserJourneyStepIndexed = UserJourneyStep & {
  index: number;
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
  web_vitals: {
    ttfb: number;
    lcp: number;
    cls: number;
    fcp: number;
  };
  page_insights: {
    score: number;
    insights_by_category: Record<InsightsCategory, PageInsightsCategory>;
  };
};

export type InsightsCategory = 'accessibility' | 'content' | 'reliability';
export type InsightsSeverity = 'critical' | 'high' | 'medium' | 'low';

export type PageInsightsCategory = {
  summary: string;
  score: number;
  issues: PageInsightsIssue[];
};

export type PageInsightsIssue = {
  severity: string;
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
