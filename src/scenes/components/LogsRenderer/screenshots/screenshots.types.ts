export interface ScreenshotData {
  id: string;
  screenshot_base64?: string;
  screenshot_url?: string;
  caption?: string;
  screenshot_size_bytes?: string;
  level?: string;
  message?: string;
  timestamp?: string;
}

export interface ScreenshotChunk {
  index: number;
  data: ScreenshotData & { chunk_index: number; chunk_total: number };
}
