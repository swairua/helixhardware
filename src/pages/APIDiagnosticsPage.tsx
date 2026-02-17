import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  runComprehensiveDiagnostics,
  testAPIEndpoint,
  formatDiagnosticResults,
  type DiagnosticResult,
} from '@/utils/apiDiagnosticsAdvanced';

export function APIDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testAction, setTestAction] = useState('health');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [testData, setTestData] = useState('');

  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnosticResults = await runComprehensiveDiagnostics();
      setResults(diagnosticResults);
      
      const report = formatDiagnosticResults(diagnosticResults);
      console.log(report);
      
      const successCount = diagnosticResults.filter(r => r.status === 'success').length;
      toast.success(`Diagnostics complete: ${successCount}/${diagnosticResults.length} tests passed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Diagnostic error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEndpoint = async () => {
    setIsLoading(true);
    try {
      let data;
      try {
        data = testData ? JSON.parse(testData) : undefined;
      } catch {
        toast.error('Invalid JSON in request body');
        setIsLoading(false);
        return;
      }

      const result = await testAPIEndpoint(testAction, {
        method: testMethod,
        data,
      });

      setResults([result]);
      toast.success(`Test complete: ${result.message}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Test error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔧 API Diagnostics</h1>
          <p className="text-gray-600">Test and debug external API connectivity</p>
        </div>

        {/* Diagnostic Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Comprehensive Test Card */}
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Diagnostics</CardTitle>
              <CardDescription>
                Run all diagnostic tests at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRunDiagnostics}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Running...' : 'Run Full Diagnostics'}
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Tests: Connectivity, Endpoints, Configuration
              </p>
            </CardContent>
          </Card>

          {/* Custom Test Card */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Endpoint Test</CardTitle>
              <CardDescription>
                Test a specific API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="action" className="text-sm font-medium">
                  Action
                </Label>
                <Input
                  id="action"
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value)}
                  placeholder="e.g., health, login"
                />
              </div>

              <div>
                <Label htmlFor="method" className="text-sm font-medium">
                  Method
                </Label>
                <select
                  id="method"
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value as 'GET' | 'POST')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option>GET</option>
                  <option>POST</option>
                </select>
              </div>

              <div>
                <Label htmlFor="data" className="text-sm font-medium">
                  Request Data (JSON, optional)
                </Label>
                <textarea
                  id="data"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder='{"email": "test@example.com"}'
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleTestEndpoint}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Endpoint'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {results.length} test(s) completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">
                            {{
                              success: '✅',
                              warning: '⚠️',
                              error: '❌',
                              info: 'ℹ️',
                            }[result.status]}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {result.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{result.test}</h3>
                        <p className="text-gray-700 mt-1">{result.message}</p>
                      </div>
                    </div>

                    {result.details && (
                      <div className="mt-4 bg-white border rounded p-3">
                        <div className="font-mono text-sm text-gray-800 overflow-auto max-h-96">
                          <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                        <Button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(result.details, null, 2))
                          }
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          Copy Details
                        </Button>
                      </div>
                    )}

                    {result.timestamp && (
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Export Results */}
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => {
                    const report = formatDiagnosticResults(results);
                    copyToClipboard(report);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Copy Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Endpoints Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-mono text-sm font-bold">health</p>
                <p className="text-gray-600 text-sm">Check API health status</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-mono text-sm font-bold">login (POST)</p>
                <p className="text-gray-600 text-sm">
                  Body: {'{'}email, password{'}'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-mono text-sm font-bold">setup (POST)</p>
                <p className="text-gray-600 text-sm">
                  Body: {'{'}email, password{'}'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-mono text-sm font-bold">check_auth (POST)</p>
                <p className="text-gray-600 text-sm">
                  Body: {'{'}token{'}'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
