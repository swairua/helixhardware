import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NetworkDiagnosticsPanel } from '@/components/NetworkDiagnosticsPanel';

export default function NetworkDiagnosticsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Network Diagnostics</h1>
            <p className="mt-2 text-gray-600">
              Troubleshoot connectivity issues with helixgeneralhardware.com API
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Info Banner */}
        <div className="rounded-lg bg-blue-100 p-4 border border-blue-300">
          <p className="text-sm text-blue-900">
            <strong>What this tool does:</strong> Tests your network connectivity to the API server
            and identifies potential firewall, proxy, DNS, or CORS issues.
          </p>
        </div>

        {/* Diagnostics Panel */}
        <NetworkDiagnosticsPanel />

        {/* Support Info */}
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Need More Help?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              If the diagnostics show errors and the troubleshooting guide doesn't help:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check the browser console (F12) for detailed error messages</li>
              <li>Contact your system administrator or network team</li>
              <li>Provide them with the full diagnostic report (copy button above)</li>
              <li>
                Try accessing the API directly from your browser:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  https://helixgeneralhardware.com/api.php?action=health
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
