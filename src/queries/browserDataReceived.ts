import { DSQuery } from 'queries/queries.types';

interface BrowserDataReceivedQueryProps {
  job?: string;
  instance?: string;
  probe?: string;
}

export function getBrowserDataReceivedQuery({
  job = '$job',
  instance = '$instance',
  probe = '$probe',
}: BrowserDataReceivedQueryProps = {}): DSQuery {
  return {
    expr: `sum by (probe) (probe_browser_data_received{probe=~"${probe}", job="${job}", instance="${instance}"})`,
    queryType: 'range',
    legendFormat: '{{ probe }}',
  };
}
