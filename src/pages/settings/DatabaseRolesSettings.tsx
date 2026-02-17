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
  Shield,
  Lock,
  Server,
  Zap
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface TableStatus {
  name: string;
  exists: boolean;
}

interface DatabaseStatus {
  connected: boolean;
  tablesFound: number;
  totalTables: number;
  missingTables: string[];
  tables: TableStatus[];
  error?: string;
}

interface RoleStatus {
  name: string;
  exists: boolean;
  description?: string;
}

interface RolesCheckResult {
  success: boolean;
  rolesExist: string[];
  rolesMissing: string[];
  totalRoles: number;
  error?: string;
}

const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || 'https://med.wayrus.co.ke/api.php';

export default function DatabaseRolesSettings() {
  // Database States
  const [databaseLoading, setDatabaseLoading] = useState(true);
  const [databaseChecking, setDatabaseChecking] = useState(false);
  const [databaseCreating, setDatabaseCreating] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [showDatabaseDetails, setShowDatabaseDetails] = useState(false);

  // Roles States
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesChecking, setRolesChecking] = useState(false);
  const [rolesCreating, setRolesCreating] = useState(false);
  const [rolesStatus, setRolesStatus] = useState<RolesCheckResult | null>(null);
  const [setupProgress, setSetupProgress] = useState<string[]>([]);
  const [showSetupProgress, setShowSetupProgress] = useState(false);

  // API Health Check - DISABLED
  // Health checks have been disabled to prevent AbortError issues
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(true);
  const [apiUrl, setApiUrl] = useState(EXTERNAL_API_URL);

  useEffect(() => {
    // Health check disabled - only run database and roles status checks
    checkDatabaseStatus();
    checkRolesStatus();
  }, []);

  async function checkDatabaseStatus() {
    try {
      setDatabaseLoading(true);
      const response = await fetch(`${apiUrl}?action=check_tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: [] })
      });

      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        setDatabaseStatus(data.data);
        toast.success(`Database check complete: ${data.data.tablesFound}/${data.data.totalTables} tables found`);
      } else {
        toast.error(data.error || 'Failed to check database status');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check database status';
      console.error('Error checking database:', error);
      toast.error(message);
    } finally {
      setDatabaseLoading(false);
    }
  }

  async function checkRolesStatus() {
    try {
      setRolesLoading(true);
      const response = await fetch('/api/admin/roles/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });

      // Check if response is valid JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API returned non-JSON response. Endpoint may not be available.');
        setRolesStatus({
          success: false,
          rolesExist: [],
          rolesMissing: [],
          totalRoles: 0,
          error: 'Roles API endpoint not available'
        });
        setRolesLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setRolesStatus(data);
        if (data.rolesMissing && data.rolesMissing.length === 0) {
          toast.success('All default roles are configured');
        } else if (data.rolesMissing) {
          toast.info(`${data.rolesMissing.length} default roles need to be created`);
        }
      } else {
        const errorMessage = data.error || 'Failed to check roles status';
        setRolesStatus({
          success: false,
          rolesExist: [],
          rolesMissing: [],
          totalRoles: 0,
          error: errorMessage
        });
        toast.error(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check roles status';
      console.error('Error checking roles:', error);
      setRolesStatus({
        success: false,
        rolesExist: [],
        rolesMissing: [],
        totalRoles: 0,
        error: message
      });
      toast.error(message);
    } finally {
      setRolesLoading(false);
    }
  }

  async function handleRefreshDatabase() {
    try {
      setDatabaseChecking(true);
      await checkDatabaseStatus();
    } finally {
      setDatabaseChecking(false);
    }
  }

  async function handleCreateMissingTables() {
    try {
      setDatabaseCreating(true);
      const response = await fetch(`${apiUrl}?action=create_missing_tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        if (data.data.success) {
          toast.success(`Successfully created ${data.data.total_created} tables`);
        } else {
          toast.error(`Created ${data.data.total_created} tables with ${data.data.total_errors} errors`);
        }
        await checkDatabaseStatus();
      } else {
        toast.error(data.error || 'Failed to create tables');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tables';
      console.error('Error creating tables:', error);
      toast.error(message);
    } finally {
      setDatabaseCreating(false);
    }
  }

  async function handleCompleteRoleSetup() {
    try {
      setRolesCreating(true);
      setSetupProgress([]);
      setShowSetupProgress(true);

      setSetupProgress(prev => [...prev, '🔄 Starting role setup...']);

      const response = await fetch('/api/admin/roles/setup-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });

      // Check if response is valid JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorMsg = 'Role setup API endpoint not available';
        setSetupProgress(prev => [...prev, `❌ ${errorMsg}`]);
        toast.error(errorMsg);
        return;
      }

      const data = await response.json();

      if (data && data.success) {
        setSetupProgress(prev => [...prev, '✅ Roles setup completed successfully']);
        toast.success('Roles and permissions configured successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkRolesStatus();
      } else {
        setSetupProgress(prev => [...prev, '❌ Role setup failed']);
        if (data && data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: string) => {
            setSetupProgress(prev => [...prev, `⚠️ ${error}`]);
          });
        }
        toast.error('Role setup failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to setup roles';
      setSetupProgress(prev => [...prev, `❌ Error: ${message}`]);
      console.error('Error setting up roles:', error);
      toast.error(message);
    } finally {
      setRolesCreating(false);
    }
  }

  const databaseHealthy = databaseStatus?.tablesFound === databaseStatus?.totalTables;
  const rolesHealthy = rolesStatus?.rolesMissing?.length === 0;
  const overallHealthy = apiHealthy && databaseHealthy && rolesHealthy;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            System Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage database tables and configure system roles and permissions
          </p>
        </div>

        {/* Overall Health Status */}
        <Card className={`mb-6 border-2 ${overallHealthy ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {overallHealthy ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">System Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    <span className="text-lg font-semibold text-orange-700 dark:text-orange-300">Configuration Required</span>
                  </>
                )}
              </div>
              <Badge variant={overallHealthy ? 'default' : 'destructive'}>
                {apiHealthy === false ? 'API Offline' : apiHealthy ? 'API OK' : 'Checking...'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">API Status</p>
                <p className="text-2xl font-bold mt-1">{apiHealthy === null ? '...' : apiHealthy ? '✓' : '✗'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Database</p>
                <p className="text-lg font-bold mt-1">{databaseStatus ? `${databaseStatus.tablesFound || 0}/${databaseStatus.totalTables || 0}` : '...'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Roles</p>
                <p className="text-lg font-bold mt-1">{rolesStatus ? `${rolesStatus.rolesExist?.length || 0}/${rolesStatus.totalRoles || 0}` : '...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Database and Roles */}
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Tables
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            {databaseLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" />
                  <span>Checking database status...</span>
                </CardContent>
              </Card>
            ) : databaseStatus ? (
              <>
                <Card className={databaseHealthy ? 'border-green-500/50' : 'border-orange-500/50'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Status
                      </CardTitle>
                      {databaseHealthy ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          All Tables Present
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Missing Tables
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tables Found</p>
                        <p className="text-2xl font-bold">{databaseStatus.tablesFound}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expected</p>
                        <p className="text-2xl font-bold">{databaseStatus.totalTables}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Missing</p>
                        <p className={`text-2xl font-bold ${databaseStatus?.missingTables?.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {databaseStatus?.missingTables?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(databaseStatus.tablesFound / databaseStatus.totalTables) * 100}%` }}
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={handleRefreshDatabase}
                        variant="outline"
                        disabled={databaseChecking || databaseCreating}
                      >
                        {databaseChecking ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Status
                          </>
                        )}
                      </Button>

                      {!databaseHealthy && (
                        <Button
                          onClick={handleCreateMissingTables}
                          disabled={databaseCreating || databaseChecking}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {databaseCreating ? (
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
                        onClick={() => setShowDatabaseDetails(true)}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {!databaseHealthy && (
                  <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <CardHeader>
                      <CardTitle className="text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Missing Tables ({databaseStatus?.missingTables?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {databaseStatus?.missingTables?.map((table) => (
                          <Badge key={table} variant="secondary" className="justify-center py-2">
                            <Table2 className="h-3 w-3 mr-1" />
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Connection Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to connect to the database. Please check your API configuration.
                  </p>
                  <Button onClick={handleRefreshDatabase} variant="outline">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            {rolesLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-3" />
                  <span>Checking roles status...</span>
                </CardContent>
              </Card>
            ) : rolesStatus ? (
              <>
                <Card className={rolesHealthy ? 'border-green-500/50' : 'border-orange-500/50'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Roles & Permissions Status
                      </CardTitle>
                      {rolesHealthy ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          All Roles Configured
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Setup Needed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Roles Configured</p>
                        <p className="text-2xl font-bold text-green-600">{rolesStatus?.rolesExist?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Missing Roles</p>
                        <p className={`text-2xl font-bold ${rolesStatus?.rolesMissing?.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {rolesStatus?.rolesMissing?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${rolesStatus && rolesStatus.totalRoles ? (rolesStatus.rolesExist?.length || 0) / rolesStatus.totalRoles * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {!rolesHealthy && (
                        <Button
                          onClick={handleCompleteRoleSetup}
                          disabled={rolesCreating}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {rolesCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Setting up Roles...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Setup Default Roles
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={() => checkRolesStatus()}
                        variant="outline"
                        disabled={rolesCreating}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {rolesStatus && rolesStatus.rolesExist && rolesStatus.rolesExist.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-5 w-5" />
                        Configured Roles ({rolesStatus?.rolesExist?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                        {rolesStatus?.rolesExist?.map((role) => (
                          <Badge key={role} variant="default" className="justify-center py-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {rolesStatus && rolesStatus.rolesMissing && rolesStatus.rolesMissing.length > 0 && (
                  <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <CardHeader>
                      <CardTitle className="text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Missing Roles ({rolesStatus?.rolesMissing?.length || 0})
                      </CardTitle>
                      <CardDescription>
                        The following roles need to be configured for full functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                        {rolesStatus?.rolesMissing?.map((role) => (
                          <Badge key={role} variant="secondary" className="justify-center py-2">
                            <Lock className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Connection Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to check roles status. Please check your API configuration.
                  </p>
                  <Button onClick={() => checkRolesStatus()} variant="outline">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Setup Progress Dialog */}
        <Dialog open={showSetupProgress} onOpenChange={setShowSetupProgress}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Role Setup Progress</DialogTitle>
              <DialogDescription>
                Configuring default roles and permissions
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-64 w-full rounded-md border p-4 bg-slate-50 dark:bg-slate-900">
              <div className="space-y-2">
                {setupProgress.map((message, index) => (
                  <p key={index} className="text-sm font-mono text-slate-700 dark:text-slate-300">
                    {message}
                  </p>
                ))}
                {rolesCreating && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Database Details Dialog */}
        <Dialog open={showDatabaseDetails} onOpenChange={setShowDatabaseDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Database Table Details</DialogTitle>
              <DialogDescription>
                Complete list of all database tables and their status
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="space-y-2">
                {databaseStatus?.tables?.map((table) => (
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
    </div>
  );
}
