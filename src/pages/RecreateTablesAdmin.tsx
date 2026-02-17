import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Database,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  checkTables,
  getMissingTables,
  recreateAllMissingTables,
  recreateRequiredTables,
  getTableStatus,
  type TableCheckResult,
  type RecreateResult,
} from '@/utils/recreateTables';

interface StatusUpdate {
  table: string;
  status: string;
  message: string;
}

export default function RecreateTablesAdmin() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [recreating, setRecreating] = useState(false);
  const [tableResults, setTableResults] = useState<TableCheckResult[]>([]);
  const [recreateResults, setRecreateResults] = useState<RecreateResult[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [missingTablesCount, setMissingTablesCount] = useState(0);
  const [requiredMissingCount, setRequiredMissingCount] = useState(0);

  useEffect(() => {
    checkTablesOnLoad();
  }, []);

  async function checkTablesOnLoad() {
    try {
      setLoading(true);
      const status = await getTableStatus();
      setTableResults(status.details);
      setMissingTablesCount(status.missingTables);
      setRequiredMissingCount(status.requiredMissing);
    } catch (error) {
      console.error('Error checking tables:', error);
      toast.error('Failed to check tables');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckTables() {
    try {
      setChecking(true);
      const results = await checkTables();
      setTableResults(results);
      const missing = results.filter(r => !r.exists);
      setMissingTablesCount(missing.length);
      toast.success(`Found ${missing.length} missing tables`);
    } catch (error) {
      console.error('Error checking tables:', error);
      toast.error('Failed to check tables');
    } finally {
      setChecking(false);
    }
  }

  async function handleRecreateAll() {
    try {
      setRecreating(true);
      setStatusUpdates([]);
      setRecreateResults([]);

      const results = await recreateAllMissingTables((update: StatusUpdate) => {
        setStatusUpdates(prev => [...prev, update]);
      });

      setRecreateResults(results);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed > 0) {
        toast.error(`Created ${successful} tables, ${failed} failed`);
      } else {
        toast.success(`All ${successful} tables created successfully!`);
      }

      // Refresh table status
      await checkTablesOnLoad();
    } catch (error) {
      console.error('Error recreating tables:', error);
      toast.error('Error recreating tables');
    } finally {
      setRecreating(false);
    }
  }

  async function handleRecreateRequired() {
    try {
      setRecreating(true);
      setStatusUpdates([]);
      setRecreateResults([]);

      const results = await recreateRequiredTables((update: StatusUpdate) => {
        setStatusUpdates(prev => [...prev, update]);
      });

      setRecreateResults(results);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed > 0) {
        toast.error(`Created ${successful} required tables, ${failed} failed`);
      } else {
        toast.success(`All ${successful} required tables created successfully!`);
      }

      // Refresh table status
      await checkTablesOnLoad();
    } catch (error) {
      console.error('Error recreating tables:', error);
      toast.error('Error recreating tables');
    } finally {
      setRecreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Checking database tables...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingTables = tableResults.filter(r => r.exists).length;
  const missingTables = tableResults.filter(r => !r.exists);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl">Database Table Management</CardTitle>
                  <CardDescription className="text-blue-100">
                    Check and recreate missing database tables
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleCheckTables}
                disabled={checking || recreating}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-3xl font-bold text-blue-600">{tableResults.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Existing Tables</p>
                <p className="text-3xl font-bold text-green-600">{existingTables}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Missing Tables</p>
                <p
                  className={`text-3xl font-bold ${
                    missingTables.length === 0 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {missingTables.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {missingTables.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                Missing Tables Detected
              </CardTitle>
              <CardDescription className="text-orange-800">
                {requiredMissingCount > 0 && (
                  <span>
                    {requiredMissingCount} required table
                    {requiredMissingCount !== 1 ? 's' : ''} missing - your application may not work
                    properly!
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredMissingCount > 0 && (
                <Button
                  onClick={handleRecreateRequired}
                  disabled={recreating}
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {recreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Required Tables...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Create Required Tables Only ({requiredMissingCount})
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleRecreateAll}
                disabled={recreating}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {recreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating All Missing Tables...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Create All Missing Tables ({missingTables.length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {missingTables.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">All tables exist</p>
                  <p className="text-sm text-green-800">Your database is properly initialized</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Updates */}
        {statusUpdates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Creation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {statusUpdates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    {update.status === 'creating' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.status === 'checking' && (
                      <RefreshCw className="h-4 w-4 animate-spin text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.status === 'info' && (
                      <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    {update.status === 'complete' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-gray-900">{update.message}</p>
                      {update.table !== 'system' && <p className="text-xs text-gray-500">{update.table}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recreate Results */}
        {recreateResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recreateResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{result.tableName}</p>
                      <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.message}
                      </p>
                      {result.error && <p className="text-xs text-red-600 mt-1">{result.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table Status Details</CardTitle>
            <CardDescription>Complete list of all tracked tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Table Name</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {tableResults.map((result, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-gray-700">{result.tableName}</td>
                      <td className="py-2 px-4">
                        {result.exists ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Exists
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {result.error && (
                          <span className="text-xs text-red-600 line-clamp-1">{result.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
