import { ZodType } from 'zod';

import { CheckFormValuesHttp, CheckFormValuesMultiHttp } from 'types';

import { HttpCheckSchema } from './HttpCheckSchema';
import { MultiHttpCheckSchema } from './MultiHttpCheckSchema';

export const CheckFormSchema: ZodType<CheckFormValuesHttp | CheckFormValuesMultiHttp> =
  MultiHttpCheckSchema.or(HttpCheckSchema);
