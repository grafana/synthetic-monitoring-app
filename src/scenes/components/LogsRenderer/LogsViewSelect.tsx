import React, { useCallback, useState } from 'react';
import { RadioButtonGroup } from '@grafana/ui';

export const LOGS_VIEW_OPTIONS = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'List logs', value: 'list' },
  { label: 'Raw logs', value: 'raw' },
];

export type LogsView = (typeof LOGS_VIEW_OPTIONS)[number]['value'];

interface LogsViewSelectProps {
  onChange: (view: string) => void;
}

export const LogsViewSelect = ({ onChange }: LogsViewSelectProps) => {
  const [selectedView, setSelectedView] = useState(LOGS_VIEW_OPTIONS[0].value);

  const handleChange = useCallback(
    (view: string) => {
      setSelectedView(view);
      onChange(view);
    },
    [onChange]
  );

  return (
    <div>
      <RadioButtonGroup options={LOGS_VIEW_OPTIONS} value={selectedView} onChange={handleChange} />
    </div>
  );
};
