import { DSQuery } from 'queries/queries.types';

interface ScriptedDataReceivedQueryProps {
  job?: string;
  instance?: string;
  probe?: string;
}

export function getScriptedDataReceivedQuery({
  job = '$job',
  instance = '$instance',
  probe = '$probe',
}: ScriptedDataReceivedQueryProps = {}): DSQuery {
  return {
    expr: `probe_data_received_bytes{probe=~"${probe}", job="${job}", instance="${instance}"}`,
    queryType: 'range',
    legendFormat: '{{ probe }}',
  };
}
