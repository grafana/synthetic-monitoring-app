import { DSQuery } from 'queries/queries.types';

interface ScriptedDataSentQueryProps {
  job?: string;
  instance?: string;
  probe?: string;
}

export function getScriptedDataSentQuery({
  job = '$job',
  instance = '$instance',
  probe = '$probe',
}: ScriptedDataSentQueryProps = {}): DSQuery {
  return {
    expr: `probe_data_sent_bytes{probe=~"${probe}", job="${job}", instance="${instance}"}`,
    queryType: 'range',
    legendFormat: '{{ probe }}',
  };
}
