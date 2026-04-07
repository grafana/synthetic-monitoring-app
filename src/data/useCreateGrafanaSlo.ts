import { useMutation } from '@tanstack/react-query';
import { createGrafanaSlo, GrafanaSloApiError } from 'slo/createGrafanaSlo';

import type { GrafanaSloCreateRequest, GrafanaSloCreateResponse } from 'slo/grafanaSlo.types';

export function useCreateGrafanaSlo() {
  return useMutation<GrafanaSloCreateResponse, GrafanaSloApiError, GrafanaSloCreateRequest>({
    mutationFn: (body) => createGrafanaSlo(body),
  });
}
