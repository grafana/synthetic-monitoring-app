export const HCL_CONFIG = {
  BLOCK_FIELDS: new Set([
    'tls_config', 
    'basic_auth', 
    'query_fields', 
    'variables',
    'fail_if_header_matches_regexp',
    'fail_if_header_not_matches_regexp',
    'validate_answer_rrs',
    'validate_authority_rrs',
    'validate_additional_rrs',
    'query_response'
  ]),
  INDENT_SIZE: 2,
  ESCAPE_CHARS: {
    '\\': '\\\\',
    '"': '\\"',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '${': '$$${',
  },
};
