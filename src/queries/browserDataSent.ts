import { DSQuery } from 'queries/queries.types';

interface BrowserDataSentQueryProps {
  job?: string;
  instance?: string;
  probe?: string;
}

export function getBrowserDataSentQuery({
  job = '$job',
  instance = '$instance',
  probe = '$probe',
}: BrowserDataSentQueryProps = {}): DSQuery {
  return {
    expr: `sum by (probe) (probe_browser_data_sent{probe=~"${probe}", job="${job}", instance="${instance}"})`,
    queryType: 'range',
    legendFormat: '{{ probe }}',
  };
}
