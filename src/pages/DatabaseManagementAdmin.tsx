import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Database,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlayCircle,
  AlertTriangle,
  Table2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TableStatus {
  name: string;
  exists: boolean;
}

interface DatabaseStatusResponse {
  status: string;
  data?: {
    connected: boolean;
    tablesFound: number;
    totalTables: number;
    missingTables: string[];
    tables: TableStatus[];
    timestamp: string;
    error?: string;
  };
  error?: string;
}

interface CreateTablesResponse {
  status: string;
  data?: {
    success: boolean;
    created: string[];
    errors: string[];
    total_created: number;
    total_errors: number;
  };
  error?: string;
}

const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php';

export default function DatabaseManagementAdmin() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tableStatus, setTableStatus] = useState<{
    connected: boolean;
    tablesFound: number;
    totalTables: number;
    missingTables: string[];
    tables: TableStatus[];
    error?: string;
  } | null>(null);
  const [createResult, setCreateResult] = useState<{
    success: boolean;
    created: string[];
    errors: string[];
    total_created: number;
    total_errors: number;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  async function checkDatabaseStatus() {
    try {
      setLoading(true);
      const response = await fetch(`${EXTERNAL_API_URL}?action=check_tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables: [] }),
      });

      const data: DatabaseStatusResponse = await response.json();

      if (data.status === 'ok' && data.data) {
        setTableStatus(data.data);
        toast.success(`Database check complete: ${data.data.tablesFound}/${data.data.totalTables} tables found`);
      } else {
        toast.error(data.error || 'Failed to check database status');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check database status';
      console.error('Error checking database:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshStatus() {
    try {
      setChecking(true);
      await checkDatabaseStatus();
    } finally {
      setChecking(false);
    }
  }

  async function handleCreateMissingTables() {
    try {
      setCreating(true);
      const response = await fetch(`${EXTERNAL_API_URL}?action=create_missing_tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data: CreateTablesResponse = await response.json();

      if (data.status === 'ok' && data.data) {
        setCreateResult(data.data);
        setShowResults(true);

        if (data.data.success) {
          toast.success(`Successfully created ${data.data.total_created} tables`);
        } else {
          toast.error(`Created ${data.data.total_created} tables with ${data.data.total_errors} errors`);
        }

        // Refresh status after creation
        await checkDatabaseStatus();
      } else {
        toast.error(data.error || 'Failed to create tables');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tables';
      console.error('Error creating tables:', error);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Checking database status...</span>
        </div>
      </div>
    );
  }

  if (!tableStatus) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unable to connect to the database. Please check your API configuration.
            </p>
            <Button onClick={handleRefreshStatus} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingCount = tableStatus.missingTables.length;
  const isHealthy = missingCount === 0;

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your application database tables
          </p>
        </div>

        {/* Database Status Card */}
        <Card className={isHealthy ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className={`h-5 w-5 ${isHealthy ? 'text-green-600' : 'text-red-600'}`} />
                <CardTitle>Database Status</CardTitle>
              </div>
              {isHealthy && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {!isHealthy && <AlertTriangle className="h-5 w-5 text-red-600" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Tables Found</p>
                <p className="text-2xl font-bold">{tableStatus.tablesFound}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-2xl font-bold">{tableStatus.totalTables}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing</p>
                <p className={`text-2xl font-bold ${missingCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {missingCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={isHealthy ? 'default' : 'destructive'} className="mt-1">
                  {isHealthy ? 'Healthy' : 'Missing Tables'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefreshStatus}
                variant="outline"
                disabled={checking || creating}
              >
                {checking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>

              {!isHealthy && (
                <Button
                  onClick={handleCreateMissingTables}
                  disabled={creating || checking}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Tables...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Create Missing Tables
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Missing Tables Info */}
        {!isHealthy && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
                Missing Tables ({missingCount})
              </CardTitle>
              <CardDescription>
                The following tables need to be created for full application functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tableStatus.missingTables.map((table) => (
                  <Badge key={table} variant="secondary" className="justify-center py-2">
                    <Table2 className="h-3 w-3 mr-1" />
                    {table}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creation Results */}
        {createResult && showResults && (
          <Card className={createResult.success ? 'border-green-500/50' : 'border-orange-500/50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {createResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
                Creation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tables Created</p>
                  <p className="text-2xl font-bold text-green-600">{createResult.total_created}</p>
                </div>
                {createResult.total_errors > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{createResult.total_errors}</p>
                  </div>
                )}
              </div>

              {createResult.created.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Successfully Created</p>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                    {createResult.created.map((table) => (
                      <Badge key={table} variant="default" className="justify-center py-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {createResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Errors</p>
                  <div className="space-y-2 bg-red-50 dark:bg-red-950/20 p-3 rounded">
                    {createResult.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Database Table Details</DialogTitle>
            <DialogDescription>
              Complete list of all database tables and their status
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            <div className="space-y-2">
              {tableStatus.tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-2 hover:bg-accent rounded"
                >
                  <span className="font-mono text-sm">{table.name}</span>
                  {table.exists ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Missing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
