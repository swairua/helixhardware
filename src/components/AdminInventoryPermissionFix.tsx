import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useDatabase';
import { fixAdminRolePermissions, checkAdminInventoryPermission } from '@/utils/fixAdminRolePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AdminInventoryPermissionFix() {
  const { profile } = useAuth();
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];

  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check admin permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (!currentCompany?.id) return;

      setChecking(true);
      const result = await checkAdminInventoryPermission(currentCompany.id);
      setHasPermission(result.hasPermission);
      if (result.error) {
        setError(result.error);
      }
      setChecking(false);
    };

    checkPermission();
  }, [currentCompany?.id]);

  const handleFixPermissions = async () => {
    if (!currentCompany?.id) {
      toast.error('Company information not available');
      return;
    }

    setFixing(true);
    setError(null);

    // Show a loading toast for long operations
    const toastId = toast.loading('Fixing permissions. This may take a moment...');

    try {
      const result = await fixAdminRolePermissions(currentCompany.id);

      if (result.success) {
        setHasPermission(true);
        setRetryCount(0);
        toast.dismiss(toastId);
        toast.success(result.message);
        // Reload page to apply new permissions
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.dismiss(toastId);
        setError(result.error || result.message);
        toast.error(result.message);
      }
    } catch (err) {
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFixing(false);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    await handleFixPermissions();
  };

  // Only show if user is admin and permission is missing
  if (profile?.role !== 'admin' || hasPermission === null) {
    return null;
  }

  if (hasPermission) {
    return null;
  }

  const isTimeoutError = error?.toLowerCase().includes('timeout') ||
                         error?.toLowerCase().includes('unresponsive');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <CardTitle>Permission Issue Detected</CardTitle>
              <CardDescription>Inventory access is restricted</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your admin role is missing the inventory view permission. This can be fixed automatically.
          </p>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20 space-y-2">
              <p className="font-medium">{error}</p>
              {isTimeoutError && retryCount < 2 && (
                <p className="text-xs opacity-75">
                  The server may be temporarily busy. Try again or contact your system administrator if the issue persists.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {error && isTimeoutError && retryCount < 2 ? (
              <Button
                onClick={handleRetry}
                disabled={fixing}
                className="flex-1"
                variant="default"
              >
                {fixing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Retrying... (Attempt {retryCount + 1})
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Fix
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleFixPermissions}
                disabled={fixing || checking}
                className="flex-1"
              >
                {fixing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Fix Permissions
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This will add the missing inventory permission to your admin role.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
