import { createContext } from 'react';

import { useCheckFormMeta } from '../CheckForm.hooks';

type CheckFormContextValue = ReturnType<typeof useCheckFormMeta>;

export const CheckFormContext = createContext<CheckFormContextValue | null>(null);
