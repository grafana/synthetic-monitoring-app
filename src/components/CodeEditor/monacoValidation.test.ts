import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import { applyCustomScriptMarkers } from './monacoValidation';

// Mock Monaco types and create test helpers
const createMockModel = (script: string): monacoType.editor.ITextModel => ({
  getValue: () => script,
  getLineContent: (lineNumber: number) => script.split('\n')[lineNumber - 1] || '',
  getLineCount: () => script.split('\n').length,
  getPositionAt: (offset: number) => {
    const lines = script.split('\n');
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (currentOffset + lineLength > offset) {
        return { lineNumber: i + 1, column: offset - currentOffset + 1 };
      }
      currentOffset += lineLength;
    }
    return { lineNumber: lines.length, column: lines[lines.length - 1].length + 1 };
  },
} as any);

const mockMonaco = {
  MarkerSeverity: { Error: 8 },
  editor: {
    setModelMarkers: jest.fn(),
  },
} as any;

describe('Monaco K6 Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('K6 Version Directives (Pragmas)', () => {
    describe('Should detect and flag', () => {
      test.each([
        // Basic version directives
        '"use k6 > 0.54";',
        "'use k6 >= v1.0.0';",
        '`use k6 < 2.0`;',
        '"use k6 <= v1.5.3";',
        "'use k6 == 1.2.0';",
        '"use k6 != v2.0.0-beta";',
        
        // Version directives with extensions
        '"use k6 with k6/x/faker > 0.4.0";',
        "'use k6 with k6/x/sql >= 1.0.1';",
        '`use k6 with k6/x/kubernetes < 2.0.0`;',
        '"use k6 with k6/x/prometheus-remote-write != v1.0.0";',
        
        // Different spacing
        '"use k6>0.54";',
        '"use k6   >=   v1.0.0";',
        '"use k6 with k6/x/faker>0.4.0";',
        
        // Version variations
        '"use k6 > 1";',
        '"use k6 >= 1.0";',
        '"use k6 < 1.2.3";',
        '"use k6 <= v1.2.3-alpha";',
        '"use k6 == 1.0.0+build.123";',
      ])('standalone directive: %s', (directive) => {
        const script = `${directive}\nimport http from 'k6/http';`;
        const model = createMockModel(script);
        
        applyCustomScriptMarkers(mockMonaco, model);
        
        expect(mockMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
          model,
          'k6-validation',
          expect.arrayContaining([
            expect.objectContaining({
              severity: 8, // Error
              message: 'Version directives cannot be used within scripts. Please remove any "use k6" statements.',
              code: 'k6-pragma-forbidden',
              startLineNumber: 1,
            })
          ])
        );
      });

      test('multiple directives in same script', () => {
        const script = `"use k6 > 0.54";
"use k6 with k6/x/faker >= 1.0.0";
import http from 'k6/http';`;
        
        const model = createMockModel(script);
        applyCustomScriptMarkers(mockMonaco, model);
        
        const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
        expect(markers).toHaveLength(2);
        expect(markers[0]).toMatchObject({
          message: 'Version directives cannot be used within scripts. Please remove any "use k6" statements.',
          startLineNumber: 1,
        });
        expect(markers[1]).toMatchObject({
          message: 'Version directives cannot be used within scripts. Please remove any "use k6" statements.',
          startLineNumber: 2,
        });
      });
    });

    describe('Should NOT detect (context-aware)', () => {
      test.each([
        // Inside function calls
        'console.log("use k6 >= 1");',
        'alert("use k6 with k6/x/faker > 0.4.0");',
        'someFunction("use k6 < 2.0");',
        
        // In variable assignments
        'const myVar = "use k6 >= 1";',
        'let directive = "use k6 with k6/x/sql >= 1.0.1";',
        'var version = "use k6 > 0.54";',
        
        // In object properties
        'const config = { directive: "use k6 >= 1" };',
        'const obj = { "use k6 > 0.54": true };',
        
        // In array literals
        'const directives = ["use k6 >= 1", "use k6 > 0.54"];',
        
        // In return statements
        'return "use k6 >= 1";',
        
        // In if conditions
        'if (script === "use k6 >= 1") {}',
        
        // In template literals (non-standalone)
        'console.log(`Version: ${"use k6 >= 1"}`);',
        
        // Comments (should be ignored completely)
        '// "use k6 >= 1"',
        '/* "use k6 with k6/x/faker > 0.4.0" */',
        
        // Invalid syntax (not real directives)
        '"use k6";', // No operator
        '"use k7 >= 1";', // Wrong tool
        '"use k6 >= ";', // No version
        '"k6 >= 1";', // Missing "use"
      ])('should ignore: %s', (code) => {
        const script = `${code}\nimport http from 'k6/http';`;
        const model = createMockModel(script);
        
        applyCustomScriptMarkers(mockMonaco, model);
        
        const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
        const pragmaMarkers = markers.filter((m: any) => m.code === 'k6-pragma-forbidden');
        expect(pragmaMarkers).toHaveLength(0);
      });
    });
  });

  describe('K6 Extension Imports', () => {
    describe('Should detect and flag', () => {
      test.each([
        // Named imports
        'import { Faker } from "k6/x/faker";',
        'import { sql } from "k6/x/sql";',
        'import { check, group } from "k6/x/utils";',
        
        // Default imports
        'import faker from "k6/x/faker";',
        'import sql from "k6/x/sql";',
        'import kubernetes from "k6/x/kubernetes";',
        
        // Namespace imports
        'import * as faker from "k6/x/faker";',
        'import * as prometheus from "k6/x/prometheus-remote-write";',
        
        // Mixed imports
        'import sql, { query } from "k6/x/sql";',
        'import faker, * as utils from "k6/x/faker";',
        
        // Different quote styles
        "import faker from 'k6/x/faker';",
        // Note: Template literals are not valid in import statements in JavaScript
        
        // Nested paths
        'import driver from "k6/x/sql/driver/postgres";',
        'import ramsql from "k6/x/sql/driver/ramsql";',
        'import auth from "k6/x/oauth/v2";',
      ])('extension import: %s', (importStatement) => {
        const script = `${importStatement}\nimport http from 'k6/http';`;
        const model = createMockModel(script);
        
        applyCustomScriptMarkers(mockMonaco, model);
        
        expect(mockMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
          model,
          'k6-validation',
          expect.arrayContaining([
            expect.objectContaining({
              severity: 8, // Error
              message: 'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.',
              code: 'k6-extension-forbidden',
              startLineNumber: 1,
            })
          ])
        );
      });

      test('multiple extension imports', () => {
        const script = `import faker from "k6/x/faker";
import sql from "k6/x/sql";
import http from 'k6/http';`;
        
        const model = createMockModel(script);
        applyCustomScriptMarkers(mockMonaco, model);
        
        const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
        const extensionMarkers = markers.filter((m: any) => m.code === 'k6-extension-forbidden');
        expect(extensionMarkers).toHaveLength(2);
      });
    });

    describe('Should NOT detect (standard k6 modules)', () => {
      test.each([
        // Standard k6 modules
        'import http from "k6/http";',
        'import { check, group } from "k6";',
        'import { Rate, Counter } from "k6/metrics";',
        'import { browser } from "k6/browser";',
        'import { crypto } from "k6/crypto";',
        'import { encoding } from "k6/encoding";',
        'import ws from "k6/ws";',
        
        // External modules
        'import lodash from "lodash";',
        'import axios from "axios";',
        'import moment from "moment";',
        
        // Relative imports
        'import utils from "./utils";',
        'import config from "../config";',
        'import helper from "../../helpers/test";',
        
        // URL imports
        'import something from "https://example.com/lib.js";',
        
        // Comments about k6/x (should be ignored)
        '// import faker from "k6/x/faker";',
        '/* import sql from "k6/x/sql"; */',
        
        // Strings containing k6/x (should be ignored)
        'console.log("import faker from k6/x/faker");',
        'const note = "We used to use k6/x/sql";',
      ])('should allow: %s', (importStatement) => {
        const script = `${importStatement}\nexport default function() {}`;
        const model = createMockModel(script);
        
        applyCustomScriptMarkers(mockMonaco, model);
        
        const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
        const extensionMarkers = markers.filter((m: any) => m.code === 'k6-extension-forbidden');
        expect(extensionMarkers).toHaveLength(0);
      });
    });
  });

  describe('Combined scenarios', () => {
    test('script with both pragma and extension violations', () => {
      const script = `"use k6 > 0.54";
import faker from "k6/x/faker";
import http from 'k6/http';

export default function() {
  console.log("This should not trigger: use k6 >= 1");
  const variable = "use k6 with k6/x/sql >= 1.0.1";
}`;
      
      const model = createMockModel(script);
      applyCustomScriptMarkers(mockMonaco, model);
      
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      
      expect(markers).toHaveLength(2);
      
      const pragmaMarkers = markers.filter((m: any) => m.code === 'k6-pragma-forbidden');
      const extensionMarkers = markers.filter((m: any) => m.code === 'k6-extension-forbidden');
      
      expect(pragmaMarkers).toHaveLength(1);
      expect(extensionMarkers).toHaveLength(1);
      
      expect(pragmaMarkers[0]).toMatchObject({
        startLineNumber: 1,
        message: 'Version directives cannot be used within scripts. Please remove any "use k6" statements.',
      });
      
      expect(extensionMarkers[0]).toMatchObject({
        startLineNumber: 2,
        message: 'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.',
      });
    });

    test('valid k6 script without violations', () => {
      const script = `import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

export default function() {
  const response = http.get('https://example.com');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
  };
}`;
      
      const model = createMockModel(script);
      applyCustomScriptMarkers(mockMonaco, model);
      
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      expect(markers).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    test('empty script', () => {
      const model = createMockModel('');
      applyCustomScriptMarkers(mockMonaco, model);
      
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      expect(markers).toHaveLength(0);
    });

    test('script with syntax errors (should not crash)', () => {
      const script = 'import { unclosed from "k6/x/faker"'; // Syntax error
      const model = createMockModel(script);
      
      // Should not throw
      expect(() => {
        applyCustomScriptMarkers(mockMonaco, model);
      }).not.toThrow();
      
      // Should return empty markers for invalid syntax
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      expect(markers).toHaveLength(0);
    });

    test('template literals as standalone expressions', () => {
      const script = '`use k6 >= v1.0.0`;\nimport http from "k6/http";';
      const model = createMockModel(script);
      
      applyCustomScriptMarkers(mockMonaco, model);
      
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      const pragmaMarkers = markers.filter((m: any) => m.code === 'k6-pragma-forbidden');
      expect(pragmaMarkers).toHaveLength(1);
    });

    test('nested template literals (should be ignored)', () => {
      const script = 'console.log(`Version: ${`use k6 >= 1`}`);';
      const model = createMockModel(script);
      
      applyCustomScriptMarkers(mockMonaco, model);
      
      const [, , markers] = mockMonaco.editor.setModelMarkers.mock.calls[0];
      const pragmaMarkers = markers.filter((m: any) => m.code === 'k6-pragma-forbidden');
      expect(pragmaMarkers).toHaveLength(0);
    });
  });
});
