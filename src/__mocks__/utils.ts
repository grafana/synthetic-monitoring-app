import { OrgRole } from 'types';
import * as utils from 'utils';

function hasRole(requiredRole: OrgRole): boolean {
  return true;
}

module.exports = {
  ...utils,
  hasRole,
};
