import { useQuery } from '@tanstack/react-query';
import { llm } from '@grafana/llm';

// Whether the Grafana LLM app is installed and configured for this org. Shared by the settings
// toggle (which can't be turned on without it, and always needs to know regardless of the
// current setting) and the explanation hook (which only needs to check once the org setting
// itself is on — `enabled` lets it skip the health-check call entirely otherwise).
export function useLlmEnabled(enabled = true) {
  return useQuery({
    queryKey: ['grafana_llm_enabled'],
    queryFn: () => llm.enabled(),
    staleTime: Infinity,
    retry: false,
    enabled,
  });
}
