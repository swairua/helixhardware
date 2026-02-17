import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TokenDebugData {
  status: string;
  timestamp: string;
  debug: {
    token_present: boolean;
    token_valid: boolean;
    token_value: string | null;
    error: string | null;
    decoded_payload: {
      sub?: string;
      email?: string;
      role?: string;
      company_id?: string;
      status?: string;
      iat?: number;
    } | null;
  };
  help: {
    token_present: string;
    token_valid: string;
    error: string;
    decoded_payload: string;
  };
}

export function TokenDebugDiagnostics() {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState<TokenDebugData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const runTokenDebug = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('med_api_token');
      const apiUrl = import.meta.env.VITE_EXTERNAL_API_URL || 'https://me.wayrus.co.ke/api.php';

      const response = await fetch(`${apiUrl}?action=token_debug`, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errorData.message || `HTTP ${response.status}`);
        toast.error('Token debug failed: ' + (errorData.message || `HTTP ${response.status}`));
        return;
      }

      const data = await response.json();
      setDebugData(data);
      toast.success('Token debug completed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run token debug';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load token debug on component mount
  useEffect(() => {
    if (isAuthenticated && !debugData) {
      runTokenDebug();
    }
  }, [isAuthenticated]);

  // Also load when expanding if we don't have data yet
  useEffect(() => {
    if (isAuthenticated && isExpanded && !debugData) {
      runTokenDebug();
    }
  }, [isExpanded]);

  if (!isAuthenticated) {
    return null;
  }

  const tokenPresent = debugData?.debug.token_present ?? false;
  const tokenValid = debugData?.debug.token_valid ?? false;
  const hasError = debugData?.debug.error !== null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className={`shadow-sm border-2 ${
      tokenValid
        ? 'border-green-200 bg-green-50/30'
        : !tokenPresent
        ? 'border-slate-200 bg-slate-50/30'
        : hasError
        ? 'border-red-200 bg-red-50/30'
        : 'border-orange-200 bg-orange-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tokenValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : hasError ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : !tokenPresent ? (
              <AlertCircle className="h-5 w-5 text-slate-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <CardTitle className="text-base">JWT Token Debug</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={runTokenDebug}
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
          {isLoading && !debugData && (
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800 font-semibold">Error running token debug:</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {debugData && (
            <>
              {/* Token Status Summary */}
              <div className={`rounded p-3 ${
                tokenValid
                  ? 'bg-green-50 border border-green-200'
                  : hasError
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Token Status</span>
                    <Badge variant={tokenValid ? 'default' : hasError ? 'destructive' : 'secondary'}>
                      {tokenValid ? '✓ Valid' : hasError ? '✗ Invalid' : '⚠ Missing'}
                    </Badge>
                  </div>

                  {/* Token Present Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authorization Header:</span>
                      <div className="flex items-center gap-2">
                        {tokenPresent ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <Badge variant="default">Present</Badge>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <Badge variant="secondary">Missing</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{debugData.help.token_present}</p>
                  </div>

                  {/* Token Valid Status */}
                  {tokenPresent && (
                    <div className="space-y-2 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Token Signature:</span>
                        <div className="flex items-center gap-2">
                          {tokenValid ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <Badge variant="default">Valid</Badge>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <Badge variant="destructive">Invalid</Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{debugData.help.token_valid}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {debugData.debug.error && (
                    <div className="border-t pt-2 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900">Error</p>
                          <p className="text-sm text-red-700 mt-1">{debugData.debug.error}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{debugData.help.error}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Generated: {new Date(debugData.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Token Value (if present) */}
              {debugData.debug.token_value && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Token Value</h4>
                  <div className="bg-slate-900 rounded p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-slate-400">JWT Token (truncated):</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-slate-300 hover:text-slate-100"
                        onClick={() => copyToClipboard(debugData.debug.token_value || '', 'token')}
                      >
                        {copiedField === 'token' ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Full Token
                          </>
                        )}
                      </Button>
                    </div>
                    <code className="text-slate-300 text-xs block overflow-x-auto break-all font-mono">
                      {debugData.debug.token_value}
                    </code>
                  </div>
                </div>
              )}

              {/* Decoded Payload */}
              {debugData.debug.decoded_payload && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Decoded Token Contents</h4>
                  <div className="bg-background rounded border space-y-2 p-3">
                    {Object.entries(debugData.debug.decoded_payload).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start gap-2 text-sm">
                        <span className="text-muted-foreground font-mono text-xs">{key}:</span>
                        <span className="font-mono text-xs text-right break-all">
                          {typeof value === 'number' && key === 'iat'
                            ? new Date(value * 1000).toLocaleString()
                            : String(value) || '(empty)'}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      {debugData.help.decoded_payload}
                    </p>
                  </div>
                </div>
              )}

              {/* Help Section */}
              {!tokenValid && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                  <h4 className="font-semibold text-sm text-blue-900">Troubleshooting:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {!tokenPresent && (
                      <li>• No token found - you may need to log in again</li>
                    )}
                    {tokenPresent && hasError && debugData.debug.error?.includes('expired') && (
                      <li>• Your token has expired - please log out and log in again</li>
                    )}
                    {tokenPresent && hasError && debugData.debug.error?.includes('signature') && (
                      <li>• Token signature is invalid - your JWT_SECRET may have changed, try logging in again</li>
                    )}
                    {tokenPresent && hasError && debugData.debug.error?.includes('format') && (
                      <li>• Token is not in the correct JWT format - it may have been corrupted</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {tokenValid && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    ✓ Your authentication token is valid and ready to use. You should be able to access protected resources.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
