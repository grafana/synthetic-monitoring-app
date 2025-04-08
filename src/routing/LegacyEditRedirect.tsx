import { useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

interface LegacyEditRedirectProps {
  entity: 'check' | 'probe';
}

export function LegacyEditRedirect({ entity }: LegacyEditRedirectProps) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const route = entity === 'probe' ? ROUTES.EditProbe : ROUTES.EditCheck;

  try {
    navigate(generateRoutePath(route, { id: params.id! }), { replace: true });
  } catch (_) {
    navigate(generateRoutePath(ROUTES.Home));
  }

  return null;
}
