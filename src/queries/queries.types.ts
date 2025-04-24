export interface DSQuery {
  expr: string;
  queryType: 'range' | 'instant';
  maxDataPoints?: number;
  interval?: string;
}

export interface DSQueryWithInterval extends DSQuery {
  interval: string;
}
