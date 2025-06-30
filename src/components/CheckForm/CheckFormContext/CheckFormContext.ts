import { createContext } from 'react';

import { useCheckFormMeta } from '../CheckForm.hooks';

export const CheckFormContext = createContext<ReturnType<typeof useCheckFormMeta> | null>(null);
