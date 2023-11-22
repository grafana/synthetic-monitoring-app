import { useState } from 'react';

export function useTrigger() {
  const [counter, setTrigger] = useState(0);

  const trigger = () => {
    setTrigger((c) => c + 1);
  };

  return [counter, trigger] as const;
}
