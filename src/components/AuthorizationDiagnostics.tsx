import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DiagnosticCheck {
  name: string;
  passed: boolean;
  details: string;
  fix?: string | null;
}

interface DiagnosticData {
  timestamp: string;
  user_profile: {
    id: string;
    email: string;
    role: string;
    status: string;
    company_id: string;
  } | null;
  companies: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  admin_users: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    company_id: string;
  }>;
  checks: Record<string, DiagnosticCheck>;
  authorization_status: string;
  message: string;
}

export function AuthorizationDiagnostics() {
  const { isAuthenticated, profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedFix, setCopiedFix] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('med_api_token');
      if (!token) {
        setError('No authentication token found');
        toast.error('Please log in first');
        return;
      }

      const apiUrl = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php';
      const response = await fetch(`${apiUrl}?action=diagnose_authorization`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errorData.message || `HTTP ${response.status}`);
        toast.error('Diagnostic failed: ' + (errorData.message || `HTTP ${response.status}`));
        return;
      }

      const data = await response.json();
      setDiagnosticData(data);
      toast.success('Diagnostics completed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run diagnostics';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isExpanded && !diagnosticData) {
      runDiagnostics();
    }
  }, [isAuthenticated, isExpanded]);

  if (!isAuthenticated || !profile) {
    return null;
  }

  const isAuthorized = diagnosticData?.authorization_status.includes('✓');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFix(id);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopiedFix(null), 2000);
  };

  return (
    <Card className={`shadow-sm border-2 ${
      isAuthorized
        ? 'border-blue-200 bg-blue-50/30'
        : isExpanded && diagnosticData
        ? 'border-orange-200 bg-orange-50/30'
        : 'border-slate-200 bg-slate-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAuthorized ? (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            ) : diagnosticData && !isAuthorized ? (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-slate-600" />
            )}
            <CardTitle className="text-base">SQL Authorization Diagnostics</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={runDiagnostics}
              disabled={isLoading}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {isLoading && !diagnosticData && (
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800 font-semibold">Error running diagnostics:</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {diagnosticData && (
            <>
              {/* Authorization Status */}
              <div className={`rounded p-3 ${
                isAuthorized
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold text-sm ${
                      isAuthorized ? 'text-blue-900' : 'text-orange-900'
                    }`}>
                      Authorization Status
                    </p>
                    <p className={`text-sm ${
                      isAuthorized ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      {diagnosticData.message}
                    </p>
                  </div>
                  <Badge variant={isAuthorized ? 'default' : 'destructive'}>
                    {diagnosticData.authorization_status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Generated: {new Date(diagnosticData.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Authorization Checks */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Authorization Checks</h4>
                <div className="space-y-2">
                  {Object.entries(diagnosticData.checks).map(([key, check]) => (
                    <div
                      key={key}
                      className={`rounded p-3 border ${
                        check.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {check.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${
                            check.passed ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {check.name}
                          </p>
                          <p className={`text-sm ${
                            check.passed ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {check.details}
                          </p>

                          {/* Show fix SQL if available */}
                          {check.fix && (
                            <div className="mt-2 bg-slate-900 rounded p-2 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-slate-400">SQL Fix:</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-slate-300 hover:text-slate-100"
                                  onClick={() => copyToClipboard(check.fix!, key)}
                                >
                                  {copiedFix === key ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                              <code className="text-slate-300 block overflow-x-auto">
                                {check.fix}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Profile Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Your Profile</h4>
                {diagnosticData.user_profile ? (
                  <div className="bg-background rounded p-3 space-y-2 text-sm border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono text-xs">{diagnosticData.user_profile.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant={
                        diagnosticData.user_profile.role.includes('admin') ? 'default' : 'secondary'
                      }>
                        {diagnosticData.user_profile.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={
                        diagnosticData.user_profile.status === 'active' ? 'default' : 'destructive'
                      }>
                        {diagnosticData.user_profile.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-muted-foreground">Company ID:</span>
                      <span className="font-mono text-xs">
                        {diagnosticData.user_profile.company_id || 'NULL (Not assigned)'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">User profile not found in database</p>
                )}
              </div>

              {/* Available Companies */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Available Companies ({diagnosticData.companies.length})
                </h4>
                {diagnosticData.companies.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {diagnosticData.companies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-background rounded p-2 text-sm border flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{company.id}</p>
                        </div>
                        <Badge variant="outline">{company.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No companies found</p>
                )}
              </div>

              {/* Other Admin Users */}
              {diagnosticData.admin_users.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">
                    Other Admin Users ({diagnosticData.admin_users.length - 1})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {diagnosticData.admin_users.map((user) => (
                      <div
                        key={user.id}
                        className={`bg-background rounded p-2 text-sm border ${
                          user.id === diagnosticData.user_profile?.id ? 'ring-2 ring-blue-400' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-xs">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Role: {user.role} | Status: {user.status}
                            </p>
                          </div>
                          <Badge variant={user.company_id ? 'default' : 'destructive'}>
                            {user.company_id ? 'Assigned' : 'Unassigned'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                <h4 className="font-semibold text-sm">How to Fix Issues:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Review the failed checks above</li>
                  <li>Click "Copy" to copy the SQL fix to your clipboard</li>
                  <li>Run the SQL in your database (phpMyAdmin, MySQL client, etc.)</li>
                  <li>Click the refresh button to verify the fix</li>
                  <li>Try saving company settings again</li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
