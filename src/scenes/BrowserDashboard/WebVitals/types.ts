export type WebVitalUnit = 'seconds' | 'milliseconds' | 'score';

export type WebVitalScore = 'good' | 'needs_improvement' | 'poor';

export type WebVitalName = 'lcp' | 'fid' | 'cls' | 'fcp' | 'inp' | 'ttfb';

export interface WebVitalValueConfig {
  name: keyof typeof WEB_VITAL_CONFIG;
  unit: string;
  score?: WebVitalScore;
  value: string | number;
  originalValue: number | null;
  unitType: WebVitalUnit;
  thresholds: [number, number];
  toString(): string;
}

export const WEB_VITAL_SCORE = {
  good: 'Good',
  needs_improvement: 'Needs improvement',
  poor: 'Poor',
};

export interface WebVitalConfig {
  name: WebVitalName;
  longName: string;
  unit: WebVitalUnit;
  description?: string;
  thresholds: [number, number];
}

export const WEB_VITAL_CONFIG: Record<WebVitalName, WebVitalConfig> = {
  lcp: {
    name: 'lcp',
    longName: 'Largest Contentful Paint',
    unit: 'seconds',
    description: "Marks the point in the page load timeline where the page's main content has likely loaded",
    thresholds: [2500, 4000],
  },
  fid: {
    name: 'fid',
    longName: 'First Input Delay',
    unit: 'milliseconds',
    description:
      'The time from when a user first interacts with a page, to the time when the browser begins processing event handlers in response to the action',
    thresholds: [100, 300],
  },
  cls: {
    name: 'cls',
    longName: 'Cumulative Layout Shift',
    unit: 'score',
    description: 'Quantifies how often users experience unexpected layout shifts - low CLS helps ensure good UX',
    thresholds: [0.1, 0.25],
  },
  fcp: {
    name: 'fcp',
    longName: 'First Contentful Paint',
    unit: 'seconds',
    description:
      'The perceived load speed by marking the first point in the page load where the user can see something on screen',
    thresholds: [1800, 3000],
  },
  inp: {
    name: 'inp',
    longName: 'Interaction to next paint',
    unit: 'milliseconds',
    description: `"Interaction to Next Paint" measures a page's responsiveness throughout all interactions by observing the latency of all qualifying interactions that occur throughout the lifespan of a user's visit`,
    thresholds: [200, 500],
  },
  ttfb: {
    name: 'ttfb',
    longName: 'Time to First Byte',
    unit: 'milliseconds',
    description: 'The time between the request for a resource and when the first byte of a response begins to arrive',
    thresholds: [800, 1800],
  },
};
