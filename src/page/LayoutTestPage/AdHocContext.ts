import { createContext } from 'react';

export const AdHocResponse = createContext<Array<{ id: string; pending: boolean }>>([]);
