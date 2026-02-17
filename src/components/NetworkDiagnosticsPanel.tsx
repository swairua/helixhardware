import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Network,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  runFullNetworkDiagnostics,
  generateNetworkDiagnosticReport,
} from '@/utils/networkDiagnosticsAdvanced';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
  recommendations?: string[];
}

export function NetworkDiagnosticsPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [report, setReport] = useState('');

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await runFullNetworkDiagnostics();
      setResults(diagnosticResults);
      const generatedReport = generateNetworkDiagnosticReport(diagnosticResults);
      setReport(generatedReport);

      // Log report to console for easy access
      console.log(generatedReport);

      // Check for errors
      const errors = diagnosticResults.filter((r) => r.status === 'error');
      if (errors.length > 0) {
        toast.error(`Found ${errors.length} issue(s). See details below.`, {
          duration: 5000,
        });
      } else {
        toast.success('All diagnostics passed!', { duration: 3000 });
      }
    } catch (error) {
      toast.error('Failed to run diagnostics');
      console.error('Diagnostics error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleTest = (testName: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    setExpandedTests(newExpanded);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(report);
    toast.success('Report copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Network className="h-5 w-5 text-blue-600" />;
    }
  };

  const errorCount = results.filter((r) => r.status === 'error').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const successCount = results.filter((r) => r.status === 'success').length;

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Network Diagnostics</CardTitle>
                <CardDescription>
                  Test connectivity to helixgeneralhardware.com API
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleRunDiagnostics}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {results.length > 0 && (
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-100 p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{successCount}</div>
                <div className="text-sm text-green-600">Passing</div>
              </div>
              <div className="rounded-lg bg-yellow-100 p-3 text-center">
                <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
              <div className="rounded-lg bg-red-100 p-3 text-center">
                <div className="text-2xl font-bold text-red-700">{errorCount}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {/* Error Summary */}
            {errorCount > 0 && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errorCount} issue(s) found. See details below and check recommendations.
                </AlertDescription>
              </Alert>
            )}

            {/* Test Results */}
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.test}
                  className={`rounded-lg border p-4 ${getStatusColor(result.status)}`}
                >
                  <button
                    onClick={() => toggleTest(result.test)}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-semibold">{result.test}</div>
                        <div className="text-sm opacity-90">{result.message}</div>
                      </div>
                    </div>
                    {(result.details || result.recommendations) && (
                      <div>
                        {expandedTests.has(result.test) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Details & Recommendations */}
                  {expandedTests.has(result.test) && (
                    <div className="mt-3 space-y-3 border-t pt-3 opacity-90">
                      {result.details && Object.keys(result.details).length > 0 && (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase">Details</div>
                          <div className="space-y-1 text-xs font-mono">
                            {Object.entries(result.details).map(([key, value]) => (
                              <div key={key} className="break-words">
                                <span className="font-semibold">{key}:</span>{' '}
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.recommendations && result.recommendations.length > 0 && (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase">
                            Recommendations
                          </div>
                          <ul className="space-y-1 text-xs">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Export Report */}
            {report && (
              <div className="space-y-2">
                <Button
                  onClick={copyReport}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Full Report to Clipboard
                </Button>
                <div className="rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-700">
                  <div className="max-h-48 overflow-auto whitespace-pre-wrap">
                    {report.substring(0, 500)}...
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Quick Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>🔴</span> Connection Failed
            </div>
            <ul className="ml-6 space-y-1 list-disc text-gray-600">
              <li>Check if med.layonsconstruction.com is accessible from your browser</li>
              <li>Verify firewall allows HTTPS (port 443) outbound</li>
              <li>If on corporate network, check with IT about proxy settings</li>
              <li>Try a different network (mobile hotspot) to isolate the issue</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>🟡</span> DNS Resolution Issue
            </div>
            <ul className="ml-6 space-y-1 list-disc text-gray-600">
              <li>Flush DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)</li>
              <li>Try changing DNS to 8.8.8.8 or 1.1.1.1</li>
              <li>Verify domain med.layonsconstruction.com is correct</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>🟡</span> Slow Connection
            </div>
            <ul className="ml-6 space-y-1 list-disc text-gray-600">
              <li>API server may be slow or overloaded</li>
              <li>Check your internet connection speed</li>
              <li>Try accessing the API from a different location</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>💡</span> CORS Issues (Browser Only)
            </div>
            <ul className="ml-6 space-y-1 list-disc text-gray-600">
              <li>In development: Restart dev server (npm run dev)</li>
              <li>In production: Backend must have CORS headers configured</li>
              <li>Contact backend team to add proper CORS headers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
