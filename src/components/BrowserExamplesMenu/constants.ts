import { SelectableOptGroup } from '@grafana/ui';

import COLOR_SCHEME_SCRIPT from './snippets/colorscheme.js?raw';
import COOKIES_SCRIPT from './snippets/cookies.js?raw';
import DISPATCH_SCRIPT from './snippets/dispatch.js?raw';
import EVALUATE_SCRIPT from './snippets/evaluate.js?raw';
import FILL_FORM_SCRIPT from './snippets/fillform.js?raw';
import GET_ATTRIBUTE_SCRIPT from './snippets/getattribute.js?raw';
import KEYBOARD_SCRIPT from './snippets/keyboard.js?raw';
import MOUSE_SCRIPT from './snippets/mouse.js?raw';
import QUERYING_SCRIPT from './snippets/querying.js?raw';
import TOUCHSCREEN_SCRIPT from './snippets/touchscreen.js?raw';
import WAIT_FOR_EVENT_SCRIPT from './snippets/waitForEvent.js?raw';
import WAIT_FOR_FUNCTION_SCRIPT from './snippets/waitForFunction.js?raw';

const COLOR_SCHEME = [
  {
    label: 'Color Scheme',
    script: COLOR_SCHEME_SCRIPT,
    value: 'colorscheme.js',
  },
];

const COOKIES = [
  {
    label: 'Cookies Manipulation',
    script: COOKIES_SCRIPT,
    value: 'cookies.js',
  },
];

const DISPATCH = [
  {
    label: 'Dispatch',
    script: DISPATCH_SCRIPT,
    value: 'dispatch.js',
  },
];

const EVALUATE = [
  {
    label: 'Evaluate',
    script: EVALUATE_SCRIPT,
    value: 'evaluate.js',
  },
];

const FILL_FORM = [
  {
    label: 'Fill Form',
    script: FILL_FORM_SCRIPT,
    value: 'fillform.js',
  },
];

const GET_ATTRIBUTE = [
  {
    label: 'Get Attribute',
    script: GET_ATTRIBUTE_SCRIPT,
    value: 'getattribute.js',
  },
];

const KEYBOARD = [
  {
    label: 'Keyboard Interaction',
    script: KEYBOARD_SCRIPT,
    value: 'keyboard.js',
  },
];

const MOUSE = [
  {
    label: 'Mouse Interaction',
    script: MOUSE_SCRIPT,
    value: 'mouse.js',
  },
];

const QUERYING = [
  {
    label: 'Querying',
    script: QUERYING_SCRIPT,
    value: 'querying.js',
  },
];

const TOUCHSCREEN = [
  {
    label: 'Touchscreen Interaction',
    script: TOUCHSCREEN_SCRIPT,
    value: 'touchscreen.js',
  },
];

const WAIT_FOR_EVENT = [
  {
    label: 'Wait for Event',
    script: WAIT_FOR_EVENT_SCRIPT,
    value: 'waitForEvent.js',
  },
];

const WAIT_FOR_FUNCTION = [
  {
    label: 'Wait for Function',
    script: WAIT_FOR_FUNCTION_SCRIPT,
    value: 'waitForFunction.js',
  },
];

export const BROWSER_EXAMPLE_CHOICES: SelectableOptGroup[] = [
  { label: 'Fill Form', options: FILL_FORM },
  { label: 'Cookies Manipulation', options: COOKIES },
  { label: 'Dispatch', options: DISPATCH },
  { label: 'Evaluate', options: EVALUATE },
  { label: 'Get Attribute', options: GET_ATTRIBUTE },
  { label: 'Keyboard Interaction', options: KEYBOARD },
  { label: 'Mouse Interaction', options: MOUSE },
  { label: 'Querying', options: QUERYING },
  { label: 'Touchscreen Interaction', options: TOUCHSCREEN },
  { label: 'Wait for Event', options: WAIT_FOR_EVENT },
  { label: 'Wait for Function', options: WAIT_FOR_FUNCTION },
  { label: 'Color Scheme', options: COLOR_SCHEME },
];
