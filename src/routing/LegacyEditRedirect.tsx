import { useEffect } from 'react';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useNavigation } from 'hooks/useNavigation';

interface Props {
  entity: 'check' | 'probe';
}

export const LegacyEditRedirect = ({ entity }: Props) => {
  const navigate = useNavigation();

  useEffect(() => {
    const route = entity === 'probe' ? AppRoutes.EditProbe : AppRoutes.EditCheck;
    const id = window.location.pathname.split('/').pop();

    if (!id) {
      navigate(generateRoutePath(AppRoutes.Home));
      return;
    }

    navigate(generateRoutePath(route, { id }));
  }, [entity, navigate]);

  return null;
};
