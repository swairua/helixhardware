import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runNetworkDiagnostics, getTroubleshootingSuggestions } from '@/utils/networkDiagnostics';

interface APIUnavailableBannerProps {
  onRetry?: () => void;
  visible?: boolean;
}

export function APIUnavailableBanner({ onRetry, visible = true }: APIUnavailableBannerProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runNetworkDiagnostics();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (showDiagnostics && diagnostics.length === 0) {
      handleRunDiagnostics();
    }
  }, [showDiagnostics]);

  if (!visible) return null;

  const troubleshootingSteps = getTroubleshootingSuggestions('failed_to_fetch');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-destructive/95 border-t border-destructive text-destructive-foreground p-4 space-y-3 z-50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold">API Connection Failed</h3>
            <p className="text-sm opacity-90">
              Unable to reach the backend API. Check your network connectivity and firewall settings.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="text-destructive-foreground hover:bg-destructive/80"
        >
          {showDiagnostics ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRetry}
          className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRunDiagnostics}
          disabled={isRunning}
          className="border-destructive-foreground text-destructive-foreground hover:bg-destructive/80"
        >
          {isRunning ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>

      {/* Diagnostics Section */}
      {showDiagnostics && (
        <div className="space-y-3 mt-3 pt-3 border-t border-destructive/50">
          {/* Diagnostics Results */}
          {diagnostics.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Diagnostic Results:</p>
              <div className="space-y-1 text-sm">
                {diagnostics.map((result, index) => (
                  <div key={index} className="pl-3 border-l-2 border-destructive-foreground/50">
                    <p className="font-mono text-xs opacity-90">{result.message}</p>
                    {result.details && (
                      <p className="text-xs opacity-75">
                        {Object.entries(result.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' | ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Troubleshooting Steps */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Troubleshooting Steps:</p>
            <ul className="space-y-1 text-xs opacity-90">
              {troubleshootingSteps.map((step, index) => (
                <li key={index} className="ml-3">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Backend Info */}
          <div className="space-y-1 text-xs opacity-75 mt-2 pt-2 border-t border-destructive/50">
            <p>
              <strong>Backend URL:</strong>{' '}
              {import.meta.env.VITE_EXTERNAL_API_URL || 'https://helixgeneralhardware.com/api.php'}
            </p>
            <p>
              <strong>Using Proxy:</strong> {window.location.href.includes('localhost') ? 'No (dev mode)' : 'Yes'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
