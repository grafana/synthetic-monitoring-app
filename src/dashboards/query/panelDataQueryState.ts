import { LoadingState, type PanelData } from '@grafana/data';

export function hasPanelDataQueryError(panelData: PanelData): boolean {
  return panelData.state === LoadingState.Error || Boolean(panelData.errors?.length);
}
