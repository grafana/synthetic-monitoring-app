import React, { useCallback, useState } from 'react';
import { RadioButtonGroup } from '@grafana/ui';

export const LOGS_VIEW_OPTIONS = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Trace', value: 'trace' },
  { label: 'Raw logs', value: 'raw' },
] as const;

export type LogsView = (typeof LOGS_VIEW_OPTIONS)[number]['value'];

interface LogsViewSelectProps {
  onChange: (view: LogsView) => void;
}

export const LogsViewSelect = ({ onChange }: LogsViewSelectProps) => {
  const [selectedView, setSelectedView] = useState<LogsView>(LOGS_VIEW_OPTIONS[0].value);

  const handleChange = useCallback(
    (view: LogsView) => {
      setSelectedView(view);
      onChange(view);
    },
    [onChange]
  );

  return (
    <div>
      <RadioButtonGroup options={[...LOGS_VIEW_OPTIONS]} value={selectedView} onChange={handleChange} />
    </div>
  );
};
