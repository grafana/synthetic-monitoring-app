// Checks are attention-ordered, so truncating large folders is safe: anything
// hidden below the fold is healthy. The swimlane expands past this limit and
// the check table paginates by it.
export const VISIBLE_CHECKS_LIMIT = 25;
