import { CheckFormValuesGRPC, GRPCCheck } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';

export function getGRPCPayload(formValues: CheckFormValuesGRPC): GRPCCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      grpc: undefined,
    },
  };
}
