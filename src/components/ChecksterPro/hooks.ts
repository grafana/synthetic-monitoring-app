import { useSearchParams } from 'react-router-dom-v5-compat';

export function useActiveTab(defaultTab: string): [string, (label: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || defaultTab;

  const onChangeTab = (label: string) => {
    setSearchParams({ tab: label });
  };

  return [activeTab, onChangeTab];
}
