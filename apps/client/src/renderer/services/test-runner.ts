import { RequestResponse } from './api';
import { TestResult, TestAssertion } from '@holonet/shared';

/**
 * Test Runner - Executes test scripts (Postman-like)
 */
export class TestRunner {
  /**
   * Execute test script with response data
   */
  async runTests(
    testScript: string,
    response: RequestResponse,
    requestData: {
      url: string;
      method: string;
      headers?: Record<string, any>;
      body?: any;
    }
  ): Promise<TestResult> {
    const startTime = Date.now();
    const assertions: TestAssertion[] = [];

    // Create a safe execution context
    const context = {
      pm: {
        response: {
          code: response.status,
          status: response.statusText,
          headers: response.headers,
          json: () => {
            try {
              return typeof response.data === 'string' 
                ? JSON.parse(response.data) 
                : response.data;
            } catch {
              return null;
            }
          },
          text: () => String(response.data),
          responseTime: response.time,
        },
        request: {
          url: requestData.url,
          method: requestData.method,
          headers: requestData.headers || {},
          body: requestData.body,
        },
        test: (name: string, fn: () => void) => {
          try {
            fn();
            assertions.push({ name, passed: true });
          } catch (error: any) {
            assertions.push({
              name,
              passed: false,
              error: error.message || String(error),
            });
          }
        },
        expect: (value: any) => {
          return {
            to: {
              be: {
                equal: (expected: any) => {
                  if (value !== expected) {
                    throw new Error(`Expected ${value} to equal ${expected}`);
                  }
                },
                above: (expected: number) => {
                  if (value <= expected) {
                    throw new Error(`Expected ${value} to be above ${expected}`);
                  }
                },
                below: (expected: number) => {
                  if (value >= expected) {
                    throw new Error(`Expected ${value} to be below ${expected}`);
                  }
                },
              },
              have: {
                property: (prop: string) => {
                  if (!(prop in value)) {
                    throw new Error(`Expected object to have property ${prop}`);
                  }
                },
              },
            },
            toBe: (expected: any) => {
              if (value !== expected) {
                throw new Error(`Expected ${value} to be ${expected}`);
              }
            },
            toEqual: (expected: any) => {
              if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
              }
            },
            toBeGreaterThan: (expected: number) => {
              if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
              }
            },
            toBeLessThan: (expected: number) => {
              if (value >= expected) {
                throw new Error(`Expected ${value} to be less than ${expected}`);
              }
            },
            toHaveProperty: (prop: string) => {
              if (!(prop in value)) {
                throw new Error(`Expected object to have property ${prop}`);
              }
            },
          };
        },
      },
    };

    try {
      // Execute test script in isolated context
      const wrappedScript = `
        (function() {
          ${testScript}
        })();
      `;

      // Use Function constructor to create isolated function
      const testFunction = new Function(
        'pm',
        'expect',
        wrappedScript
      );

      // Execute with context
      testFunction(
        context.pm,
        context.pm.expect
      );
    } catch (error: any) {
      assertions.push({
        name: 'Script Execution',
        passed: false,
        error: error.message || String(error),
      });
    }

    const executionTime = Date.now() - startTime;
    const passed = assertions.every(a => a.passed);

    return {
      passed,
      assertions,
      executionTime,
      timestamp: new Date(),
    };
  }
}
