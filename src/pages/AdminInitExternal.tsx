import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle2, Zap, AlertCircle, Server, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  initializeExternalAPI,
  checkAdminExists,
  getDatabaseInfo,
} from '@/utils/externalApiSetup';
import { runApiDiagnostics, generateDiagnosticReport } from '@/utils/apiDiagnostics';

export default function AdminInitExternal() {
  const [adminExists, setAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState<string[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [customEmail, setCustomEmail] = useState('admin@mail.com');
  const [customPassword, setCustomPassword] = useState('Pass123');
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_EXTERNAL_API_URL || 'https://helixgeneralhardware.com/api.php'
  );
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any[]>([]);

  const ADMIN_EMAIL = 'admin@mail.com';
  const ADMIN_PASSWORD = 'Pass123';

  useEffect(() => {
    checkAdminUser();
  }, []);

  async function checkAdminUser() {
    try {
      setCheckingAdmin(true);

      const exists = await checkAdminExists({ apiUrl, email: customEmail, password: customPassword });
      setAdminExists(exists);

      // Also get database info
      const info = await getDatabaseInfo({ apiUrl });
      setDatabaseInfo(info);
    } catch (error) {
      console.error('Error checking admin:', error);
      setAdminExists(false);
    } finally {
      setCheckingAdmin(false);
    }
  }

  async function runDiagnostics() {
    try {
      setDiagnosticsRunning(true);
      const results = await runApiDiagnostics(apiUrl);
      setDiagnosticsResults(results);

      const report = generateDiagnosticReport(results);
      console.log(report);

      toast.success('Diagnostics complete - check console for full report', {
        duration: 5000,
      });
    } catch (error) {
      toast.error('Error running diagnostics');
      console.error('Diagnostics error:', error);
    } finally {
      setDiagnosticsRunning(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startInitialization() {
    setInitializing(true);
    setInitProgress([]);

    try {
      const result = await initializeExternalAPI({
        apiUrl,
        email: customEmail,
        password: customPassword,
        onProgress: (message: string) => {
          setInitProgress(prev => [...prev, message]);
        },
      });

      if (result.success) {
        // Verify creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAdminExists(true);

        toast.success('✅ Database initialized successfully!', {
          description: `Admin created: ${result.adminEmail}`,
          duration: 5000,
        });
      } else {
        // Show error with troubleshooting info
        const errorLines = result.message.split('\n');
        toast.error('Initialization failed', {
          description: errorLines[0],
          duration: 8000,
        });

        // Log full error for user to see
        setInitProgress(prev => [...prev, '❌ ERROR: ' + result.message]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Initialization error', {
        description: errorMessage.split('\n')[0],
        duration: 8000,
      });
      setInitProgress(prev => [...prev, '❌ ERROR: ' + errorMessage]);
      console.error('Init error:', error);
    } finally {
      setInitializing(false);
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Checking database status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Server className="h-6 w-6" />
            <CardTitle className="text-2xl">External API Database Setup</CardTitle>
          </div>
          <CardDescription className="text-orange-50">
            Initialize your MySQL database and create the admin account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* API Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">API Configuration</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="api-url" className="text-sm font-medium text-gray-700">
                  API URL
                </Label>
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  disabled={initializing || adminExists}
                  className="mt-2"
                  placeholder="https://helixgeneralhardware.com/api.php"
                />
              </div>
              {databaseInfo && (
                <div className="bg-white rounded p-3 border border-blue-300 text-sm text-blue-900">
                  {databaseInfo.connected ? (
                    <p>✓ API is connected and database tables are ready ({databaseInfo.userCount} users)</p>
                  ) : (
                    <p className="text-orange-700">⚠ Could not verify database connection</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {adminExists ? (
            // Admin Already Exists
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="text-green-800 font-bold text-lg">✅ Admin Already Initialized</p>
                <p className="text-sm text-green-700 mt-1">
                  Your database is ready with the admin account configured.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-2 border border-green-300">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <p className="font-mono text-green-700 font-medium">{ADMIN_EMAIL}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Password:</span>
                    <p className="font-mono text-green-700 font-medium">{ADMIN_PASSWORD}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => (window.location.href = '/app')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Go to Sign In
                </Button>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 rounded p-3 text-left">
                <p className="font-semibold mb-2">Setup Complete ✓</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Database tables created and initialized</li>
                  <li>Admin user account configured</li>
                  <li>Authentication system active</li>
                  <li>Ready for production use</li>
                </ul>
              </div>
            </div>
          ) : (
            // Admin Setup Needed
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Database Needs Setup</h3>
                    <p className="text-sm text-orange-800 mt-1">
                      Click below to initialize the database and create the admin user. This will:
                    </p>
                    <ul className="list-disc list-inside text-sm text-orange-800 mt-2 ml-2 space-y-1">
                      <li>Create all required database tables</li>
                      <li>Initialize the admin user account</li>
                      <li>Set up JWT authentication</li>
                      <li>Configure default settings</li>
                    </ul>
                  </div>
                </div>

                {initializing && initProgress.length > 0 && (
                  <div className="bg-white rounded p-4 border border-orange-300 space-y-2 max-h-48 overflow-y-auto">
                    {initProgress.map((message, index) => (
                      <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-lg text-orange-600">→</span>
                        <span>{message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={startInitialization}
                  disabled={initializing}
                  size="lg"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {initializing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Initialize Database & Create Admin User
                    </>
                  )}
                </Button>
              </div>

              {/* Manual Setup Instructions */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Or Setup Manually via API</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Run this curl command to initialize the database:
                    </p>
                    <div className="bg-gray-900 rounded p-4 font-mono text-xs text-green-400 overflow-x-auto">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex-1 break-all">
                          {`curl -X POST "${apiUrl}" -H "Content-Type: application/x-www-form-urlencoded" -d "action=setup&email=${encodeURIComponent(customEmail)}&password=${encodeURIComponent(customPassword)}"`}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `curl -X POST "${apiUrl}" -H "Content-Type: application/x-www-form-urlencoded" -d "action=setup&email=${encodeURIComponent(customEmail)}&password=${encodeURIComponent(customPassword)}"`
                            )
                          }
                          className="text-gray-400 hover:text-gray-200 transition flex-shrink-0"
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">Expected response:</p>
                    <pre className="bg-white rounded p-3 text-xs overflow-x-auto border border-blue-200 text-gray-700">
{`{
  "status": "success",
  "message": "Admin user created",
  "id": 1,
  "email": "${customEmail}"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Credentials Display */}
              <div className="space-y-3 bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm font-medium text-amber-900">Default Admin Credentials:</p>
                <div className="space-y-2 text-sm text-amber-900">
                  <div className="flex justify-between bg-white rounded p-2 border border-amber-200">
                    <span className="font-medium">Email:</span>
                    <span className="font-mono font-semibold">{ADMIN_EMAIL}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-2 border border-amber-200">
                    <span className="font-medium">Password:</span>
                    <span className="font-mono font-semibold">{ADMIN_PASSWORD}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-2 border border-amber-200">
                    <span className="font-medium">Role:</span>
                    <span className="font-mono font-semibold">admin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Section */}
          <div className="border-t pt-6">
            <Button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              variant="outline"
              className="w-full mb-4"
            >
              <Settings className="mr-2 h-4 w-4" />
              {showDiagnostics ? 'Hide' : 'Show'} Advanced Diagnostics
            </Button>

            {showDiagnostics && (
              <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Click below to run diagnostics and troubleshoot API connectivity issues:
                </p>

                <Button
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {diagnosticsRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Run API Diagnostics
                    </>
                  )}
                </Button>

                {diagnosticsResults.length > 0 && (
                  <div className="space-y-3 mt-4 bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900">Diagnostic Results:</p>
                    {diagnosticsResults.map((result, index) => (
                      <div
                        key={index}
                        className={`rounded p-3 text-sm ${
                          result.status === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : result.status === 'warning'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span>
                            {result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'}
                          </span>
                          {result.name}
                        </div>
                        <p className="text-gray-700 mt-1">{result.message}</p>
                        {result.details && (
                          <details className="mt-2 text-xs text-gray-600">
                            <summary className="cursor-pointer underline">Show details</summary>
                            <pre className="mt-2 bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-3 bg-blue-50 p-2 rounded border border-blue-200">
                      💡 Full diagnostic report printed to browser console. Open developer tools (F12) to see detailed logs.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
