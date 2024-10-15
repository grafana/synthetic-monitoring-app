import { FetchResponse } from '@grafana/runtime';

import type { ExtendedProbe } from 'types';

export type BackendError = FetchResponse<{ err: string; msg: string }>;

export interface DeleteProbeButtonProps {
  probe: ExtendedProbe;
  onDeleteSuccess?: () => void;
}
