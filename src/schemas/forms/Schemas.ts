import { ZodType } from 'zod';

import { CheckFormValues } from 'types';

import { HttpCheckSchema } from './HttpCheckSchema';
import { MultiHttpCheckSchema } from './MultiHttpCheckSchema';
import { PingSchema } from './PingSchema';

export const CheckFormSchema: ZodType<CheckFormValues> = MultiHttpCheckSchema.or(HttpCheckSchema);
