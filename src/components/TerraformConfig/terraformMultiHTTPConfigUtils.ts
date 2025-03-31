import { MultiHttpAssertionType, MultiHttpVariableType } from 'types';
import { fromBase64 } from 'utils';
import {
  Assertion,
  AssertionConditionVariant,
  AssertionJsonPath,
  AssertionJsonPathValue,
  AssertionRegex,
  AssertionSubjectVariant,
  AssertionText,
  MultiHttpRequestBody,
  MultiHttpVariable,
} from 'components/MultiHttp/MultiHttpTypes';

import {
  TFMultiHttpAssertion,
  TFMultiHTTPAssertionCondition,
  TFMultiHttpAssertionSubject,
  TFMultiHTTPAssertionType,
  TFMultiHttpRequestBody,
  TFMultiHttpVariable,
  TFMultiHTTPVariableType,
} from './terraformTypes';

const ASSERTION_TYPES = {
  TEXT: 'TEXT',
  JSON_PATH_VALUE: 'JSON_PATH_VALUE',
  JSON_PATH_ASSERTION: 'JSON_PATH_ASSERTION',
  REGEX_ASSERTION: 'REGEX_ASSERTION',
} as const;

const CONDITION_MAP: Record<AssertionConditionVariant, TFMultiHTTPAssertionCondition> = {
  [AssertionConditionVariant.Contains]: 'CONTAINS',
  [AssertionConditionVariant.NotContains]: 'NOT_CONTAINS',
  [AssertionConditionVariant.Equals]: 'EQUALS',
  [AssertionConditionVariant.StartsWith]: 'STARTS_WITH',
  [AssertionConditionVariant.EndsWith]: 'ENDS_WITH',
  [AssertionConditionVariant.TypeOf]: 'TYPE_OF',
};

const SUBJECT_MAP: Record<AssertionSubjectVariant, TFMultiHttpAssertionSubject> = {
  [AssertionSubjectVariant.ResponseBody]: 'RESPONSE_BODY',
  [AssertionSubjectVariant.ResponseHeaders]: 'RESPONSE_HEADERS',
  [AssertionSubjectVariant.HttpStatusCode]: 'HTTP_STATUS_CODE',
};

const VARIABLE_TYPE_MAP: Record<MultiHttpVariableType, TFMultiHTTPVariableType> = {
  [MultiHttpVariableType.CSS_SELECTOR]: 'CSS_SELECTOR',
  [MultiHttpVariableType.JSON_PATH]: 'JSON_PATH',
  [MultiHttpVariableType.REGEX]: 'REGEX',
};

function isAssertionText(assertion: Assertion): assertion is AssertionText {
  return assertion.type === MultiHttpAssertionType.Text;
}

function isAssertionJsonPathValue(assertion: Assertion): assertion is AssertionJsonPathValue {
  return assertion.type === MultiHttpAssertionType.JSONPathValue;
}

function isAssertionJsonPath(assertion: Assertion): assertion is AssertionJsonPath {
  return assertion.type === MultiHttpAssertionType.JSONPath;
}

function isAssertionRegex(assertion: Assertion): assertion is AssertionRegex {
  return assertion.type === MultiHttpAssertionType.Regex;
}

// Helper function to safely map enum values
function mapEnumToTerraformValue<T extends number, R extends string>(
  value: T,
  map: Record<T, R>,
  errorMessage: string
): R {
  const mapped = map[value];
  if (!mapped) {
    throw new Error(errorMessage);
  }
  return mapped;
}

/**
 * Maps an assertion condition to its Terraform configuration format
 */
export const mapTFMultiHTTPAssertionCondition = (
  condition: AssertionConditionVariant
): TFMultiHTTPAssertionCondition => {
  return mapEnumToTerraformValue(condition, CONDITION_MAP, `Unknown condition: ${condition}`);
};

/**
 * Maps an assertion subject to its Terraform configuration format
 */
export const mapTFMultiHTTPAssertionSubject = (
  subject: AssertionSubjectVariant
): TFMultiHttpAssertionSubject => {
  return mapEnumToTerraformValue(subject, SUBJECT_MAP, `Unknown subject: ${subject}`);
};

/**
 * Maps an assertion to its Terraform configuration format
 */
export function mapAssertionsToTF(entryCheck: Assertion): TFMultiHttpAssertion {
  if (!entryCheck) {
    throw new Error('Assertion cannot be null or undefined');
  }

  const assertion: TFMultiHttpAssertion = {
    type: mapAssertionType(entryCheck.type),
  };

  switch (assertion.type) {
    case ASSERTION_TYPES.TEXT: {
      // For TEXT assertions, we expect `condition`, `subject`, and `value`
      if (isAssertionText(entryCheck)) {
        assertion.condition = mapTFMultiHTTPAssertionCondition(entryCheck.condition);
        assertion.subject = mapTFMultiHTTPAssertionSubject(entryCheck.subject);
        assertion.value = entryCheck.value;
      }
      break;
    }

    case ASSERTION_TYPES.JSON_PATH_VALUE: {
      if (isAssertionJsonPathValue(entryCheck)) {
        assertion.condition = mapTFMultiHTTPAssertionCondition(entryCheck.condition);
        assertion.expression = entryCheck.expression;
        assertion.value = entryCheck.value;
      }
      break;
    }

    case ASSERTION_TYPES.JSON_PATH_ASSERTION: {
      // For JSON_PATH_ASSERTION, we only need the `expression`
      if (isAssertionJsonPath(entryCheck)) {
        assertion.expression = entryCheck.expression;
      }
      break;
    }

    case ASSERTION_TYPES.REGEX_ASSERTION: {
      // For REGEX_ASSERTION, we expect `subject`, and `expression`
      if (isAssertionRegex(entryCheck)) {
        assertion.subject = mapTFMultiHTTPAssertionSubject(entryCheck.subject);
        assertion.expression = entryCheck.expression;
      }
      break;
    }
  }

  return assertion;
}

/**
 * Maps a variable type to its Terraform configuration format
 */
export function mapVariablesToTF(variable: MultiHttpVariable): TFMultiHttpVariable {
  return {
    ...variable,
    type: mapEnumToTerraformValue(variable.type, VARIABLE_TYPE_MAP, `Unknown variable type: ${variable.type}`),
  };
}

/**
 * Maps a request body to its Terraform configuration format
 */
export function mapRequestBodyToTF(body?: MultiHttpRequestBody): TFMultiHttpRequestBody | undefined {
  if (!body) {
    return undefined;
  }

  return {
    content_type: body.contentType,
    content_encoding: body.contentEncoding,
    payload: fromBase64(body.payload),
  };
}

// Helper function to map assertion types
function mapAssertionType(type: MultiHttpAssertionType): TFMultiHTTPAssertionType {
  switch (type) {
    case MultiHttpAssertionType.Text:
      return ASSERTION_TYPES.TEXT;
    case MultiHttpAssertionType.JSONPathValue:
      return ASSERTION_TYPES.JSON_PATH_VALUE;
    case MultiHttpAssertionType.JSONPath:
      return ASSERTION_TYPES.JSON_PATH_ASSERTION;
    case MultiHttpAssertionType.Regex:
      return ASSERTION_TYPES.REGEX_ASSERTION;
    default:
      throw new Error(`Unknown assertion type: ${type}`);
  }
}
