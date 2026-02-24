import React, { useState, useEffect } from 'react';
import { Item, TestResult } from '@holonet/shared';
import { TestRunner } from '../services/test-runner';
import { RequestResponse } from '../services/api';

interface TestPanelProps {
  item: Item | null;
  response: RequestResponse | null;
  requestData: {
    url: string;
    method: string;
    headers?: Record<string, any>;
    body?: any;
  };
}

export function TestPanel({ item, response, requestData }: TestPanelProps) {
  const [testScript, setTestScript] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);

  const testRunner = new TestRunner();

  useEffect(() => {
    if (item?.testScript) {
      setTestScript(item.testScript);
    } else {
      // Default test script template
      setTestScript(`// Test script (Postman-like syntax)
pm.test("Status code is 200", function () {
  pm.expect(pm.response.code).to.be.equal(200);
});

pm.test("Response time is less than 500ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});
`);
    }
  }, [item]);

  const handleRunTests = async () => {
    if (!response || !item) return;

    setRunning(true);
    try {
      const result = await testRunner.runTests(testScript, response, requestData);
      setTestResult(result);

      // Save test script and results to item (via serverClient)
      // This will be handled by the parent component
    } catch (error: any) {
      setTestResult({
        passed: false,
        assertions: [
          {
            name: 'Test Execution Error',
            passed: false,
            error: error.message || String(error),
          },
        ],
        executionTime: 0,
        timestamp: new Date(),
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveScript = () => {
    // Save script to item (via serverClient)
    // This will be handled by the parent component
  };

  if (!item) {
    return (
      <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-4">🧪</div>
          <div>Select a request to write tests</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">Test Script</h3>
          <button
            onClick={handleRunTests}
            disabled={!response || running}
            className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium"
          >
            {running ? 'Running...' : 'Run Tests'}
          </button>
          <button
            onClick={handleSaveScript}
            className="px-4 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium"
          >
            Save Script
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Test Script Editor */}
        <div className="w-1/2 border-r border-[#2a2a2a] flex flex-col">
          <div className="p-2 border-b border-[#2a2a2a] text-xs text-gray-400">
            Write test scripts using Postman-like syntax
          </div>
          <textarea
            value={testScript}
            onChange={(e) => setTestScript(e.target.value)}
            className="flex-1 p-4 bg-[#1a1a1a] border-none font-mono text-sm text-white focus:outline-none resize-none"
            placeholder="// Example:
pm.test('Status code is 200', function () {
  pm.expect(pm.response.code).to.be.equal(200);
});"
          />
        </div>

        {/* Test Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!response ? (
            <div className="text-center text-gray-500 py-8">
              Send a request first to run tests
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    testResult.passed
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {testResult.passed ? '✅ All Tests Passed' : '❌ Tests Failed'}
                </div>
                <div className="text-sm text-gray-400">
                  {testResult.assertions.length} assertions • {testResult.executionTime}ms
                </div>
                <div className="text-xs text-gray-500">
                  {testResult.timestamp.toLocaleTimeString()}
                </div>
              </div>

              <div className="space-y-2">
                {testResult.assertions.map((assertion, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      assertion.passed
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-red-900/20 border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={assertion.passed ? 'text-green-300' : 'text-red-300'}>
                        {assertion.passed ? '✓' : '✗'}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {assertion.name}
                      </span>
                    </div>
                    {assertion.error && (
                      <div className="text-xs text-red-300 mt-1 ml-6">
                        {assertion.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Click "Run Tests" to execute the test script
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
