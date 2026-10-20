export interface ScreenshotData {
  id: string;
  status?: 'loading' | 'missing-datasource' | 'missing' | 'error';
  url?: string;
  expiresAt?: number;
  retry?: () => void;
}
