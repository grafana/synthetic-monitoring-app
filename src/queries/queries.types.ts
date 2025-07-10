export interface DSQuery {
  expr: string;
  queryType: 'range' | 'instant';
  maxDataPoints?: number;
  interval?: string;
  legendFormat?: string;
}

export interface DSQueryWithInterval extends DSQuery {
  interval: string;
}
