import { SelectableOptGroup } from '@grafana/ui';

// Cookies
import ACCESS_COOKIE_SCRIPT from './snippets/access_cookie.js?raw';
// Data uploads
import ADVANCED_MULTIPART_REQUEST_SCRIPT from './snippets/advanced_multipart_request.js?raw';
// API CRUD operations
import CORE_K6_APIS_CRUD_SCRIPT from './snippets/api_crud_operations_k6_core_apis.js?raw';
import HTTPX_AND_K6CHAIJS_CRUD_SCRIPT from './snippets/api_crud_operations_k6_new_apis.js?raw';
// Authentication/Authorization
import AWS_AUTH_SCRIPT from './snippets/aws_auth.js?raw';
import BASIC_AUTH_SCRIPT from './snippets/basic_auth.js?raw';
// Browser
// import BROWSER_FILL_FORM_SCRIPT from './snippets/browser_fill_form.js?raw';
// Extracting values/tokens from form fields
import EXTRACT_TOKEN_SCRIPT from './snippets/extract_token_csrf.js?raw';
// Correlation
import EXTRACT_TOKEN_JSON_SCRIPT from './snippets/extract_token_json.js?raw';
// HTML
import FORM_SUBMISSION_SCRIPT from './snippets/form_submission.js?raw';
// HTTP/2
import HTTP2_REQUEST_SCRIPT from './snippets/http2_request.js?raw';
import LOG_COOKIE_SCRIPT from './snippets/log_cookie.js?raw';
import NTLM_AUTH_SCRIPT from './snippets/ntlm_auth.js?raw';
// SOAP
import SOAP_REQUEST_SCRIPT from './snippets/soap_request.js?raw';
import FILE_UPLOAD_SCRIPT from './snippets/upload_file.js?raw';
import VU_COOKIE_JAR_SCRIPT from './snippets/vu_cookie_jar.js?raw';
// WebSocket
import WEBSOCKET_API_SCRIPT from './snippets/websocket_api.js?raw';

export type ExampleScript = {
  label: string;
  script: string;
  value: string;
};

const API_CRUD_OPERATIONS_CHOICES = [
  {
    label: 'Core k6 APIs example',
    script: CORE_K6_APIS_CRUD_SCRIPT,
    value: 'api_crud_operations_k6_core_apis.js',
  },
  {
    label: 'httpx and k6chaijs example',
    script: HTTPX_AND_K6CHAIJS_CRUD_SCRIPT,
    value: 'api_crud_operations_k6_new_apis.js',
  },
];

const AUTH_CHOICES = [
  {
    label: 'Basic authentication',
    script: BASIC_AUTH_SCRIPT,
    value: 'basic_auth.js',
  },
  {
    label: 'NTLM authentication',
    script: NTLM_AUTH_SCRIPT,
    value: 'ntlm_auth.js',
  },
  {
    label: 'AWS Signature v4 authentication',
    script: AWS_AUTH_SCRIPT,
    value: 'aws_auth.js',
  },
];

const COOKIES_CHOICES = [
  {
    label: 'Accessing a cookie set in response headers',
    script: ACCESS_COOKIE_SCRIPT,
    value: 'access_cookie.js',
  },
  {
    label: 'Logging all cookies in response',
    script: LOG_COOKIE_SCRIPT,
    value: 'log_cookie.js',
  },
  {
    label: 'Setting a cookie in VU cookie jar',
    script: VU_COOKIE_JAR_SCRIPT,
    value: 'vu_cookie_jar.js',
  },
];

const CORRELATION_CHOICES = [
  {
    label: 'Extracting values from JSON response',
    script: EXTRACT_TOKEN_JSON_SCRIPT,
    value: 'extract_token_json.js',
  },
];

const DATA_UPLOADS = [
  {
    label: 'Uploading a file',
    script: FILE_UPLOAD_SCRIPT,
    value: 'upload_file.js',
  },
  {
    label: 'Advanced multipart request',
    script: ADVANCED_MULTIPART_REQUEST_SCRIPT,
    value: 'advanced_multipart_request.js',
  },
];

const EXTRACTING_VALUES_CHOICES = [
  {
    label: 'Extracting values from hidden input fields',
    script: EXTRACT_TOKEN_SCRIPT,
    value: 'extract_token_csrf.js',
  },
];

const HTML_CHOICES = [
  {
    label: 'Filling in and submitting forms',
    script: FORM_SUBMISSION_SCRIPT,
    value: 'form_submission.js',
  },
];

const HTTP2_CHOICES = [
  {
    label: 'Making HTTP/2 requests',
    script: HTTP2_REQUEST_SCRIPT,
    value: 'http2_request.js',
  },
];

const SOAP_CHOICES = [
  {
    label: 'Making SOAP requests',
    script: SOAP_REQUEST_SCRIPT,
    value: 'soap_request.js',
  },
];

const API_CHOICES = [
  {
    label: 'Testing a WebSocket API',
    script: WEBSOCKET_API_SCRIPT,
    value: 'websocket_api.js',
  },
];

// const BROWSER_CHOICES = [
//   {
//     label: 'Fill and submit form',
//     script: BROWSER_FILL_FORM_SCRIPT,
//     value: 'browser_fill_form.js',
//   },
// ];

export const SCRIPT_EXAMPLE_CHOICES: SelectableOptGroup[] = [
  { label: 'Authentication/Authorization', options: AUTH_CHOICES },
  { label: 'API CRUD operations', options: API_CRUD_OPERATIONS_CHOICES },
  { label: 'Cookies', options: COOKIES_CHOICES },
  { label: 'Correlation', options: CORRELATION_CHOICES },
  { label: 'Data uploads', options: DATA_UPLOADS },
  {
    label: 'Extracting values/tokens from form fields',
    options: EXTRACTING_VALUES_CHOICES,
  },
  { label: 'HTML', options: HTML_CHOICES },
  { label: 'HTTP/2', options: HTTP2_CHOICES },
  { label: 'SOAP', options: SOAP_CHOICES },
  { label: 'WebSocket', options: API_CHOICES },
  // { label: 'Browser', options: BROWSER_CHOICES },
];

// export { default as DEFAULT_SCRIPT } from './snippets/snippets/default_script.js?raw';

// export { default as PLZ_OPTIONS_EXAMPLE } from './snippets/snippets/plz_options_example.js?raw';
