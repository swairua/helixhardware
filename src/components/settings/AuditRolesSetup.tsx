import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentCompanyId } from '@/contexts/CompanyContext';
import { setupAuditRoles, verifyAuditRolesSetup } from '@/utils/setupAuditRoles';
import { toast } from 'sonner';

export function AuditRolesSetup() {
  const { isAdmin } = useAuth();
  const companyId = useCurrentCompanyId();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{
    salesRoleExists: boolean;
    accountsRoleExists: boolean;
    salesCorrect: boolean;
    accountsCorrect: boolean;
    issues: string[];
  } | null>(null);

  // Verify setup on mount
  useEffect(() => {
    if (isAdmin && companyId) {
      verifyRoles();
    }
  }, [isAdmin, companyId]);

  const verifyRoles = async () => {
    if (!companyId) return;
    setVerifying(true);
    const result = await verifyAuditRolesSetup(companyId);
    setSetupStatus(result);
    setVerifying(false);
  };

  const handleSetupRoles = async () => {
    if (!companyId) {
      toast.error('Company ID not found');
      return;
    }

    setLoading(true);
    try {
      const result = await setupAuditRoles(companyId);

      if (result.success) {
        toast.success(result.message);
        await verifyRoles();
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      console.error('Error setting up audit roles:', error);
      toast.error('Failed to setup audit roles');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const allRolesSetup = setupStatus?.salesRoleExists && setupStatus?.accountsRoleExists &&
    setupStatus?.salesCorrect && setupStatus?.accountsCorrect;

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-primary/20 bg-primary-light/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <CardTitle>Audit Roles Configuration</CardTitle>
                <CardDescription>
                  Set up Sales and Accounts audit roles with limited access
                </CardDescription>
              </div>
            </div>
            {allRolesSetup && (
              <Badge variant="outline" className="bg-success-light text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
            {setupStatus && !allRolesSetup && (
              <Badge variant="outline" className="bg-warning-light text-warning border-warning/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales Audit Role */}
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sales Audit Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role Status:</span>
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : setupStatus?.salesRoleExists ? (
                    <Badge variant="outline" className="bg-success-light text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive-light text-destructive border-destructive/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Permissions:</span>
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : setupStatus?.salesCorrect ? (
                    <Badge variant="outline" className="bg-success-light text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive-light text-destructive border-destructive/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Limited access to quotations, invoices, and proforma. No delete permissions.
                </p>
              </CardContent>
            </Card>

            {/* Accounts Audit Role */}
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Accounts Audit Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role Status:</span>
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : setupStatus?.accountsRoleExists ? (
                    <Badge variant="outline" className="bg-success-light text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive-light text-destructive border-destructive/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Permissions:</span>
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : setupStatus?.accountsCorrect ? (
                    <Badge variant="outline" className="bg-success-light text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive-light text-destructive border-destructive/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Full access to payments, invoices, and credit notes. No delete permissions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issues */}
          {setupStatus && setupStatus.issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Issues found:</p>
                  <ul className="list-disc list-inside text-sm">
                    {setupStatus.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Information */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm">Audit Roles Overview</h4>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm mb-1 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Sales Audit Role</span>
                </p>
                <p className="text-xs text-muted-foreground ml-6">
                  • Can create and view quotations, proforma invoices<br />
                  • Can view invoices and credit notes<br />
                  • Cannot create, edit, or delete anything except quotations & proforma<br />
                  • Limited menu access: No Payments, Inventory, or Settings
                </p>
              </div>

              <div>
                <p className="font-medium text-sm mb-1 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Accounts Audit Role</span>
                </p>
                <p className="text-xs text-muted-foreground ml-6">
                  • Full access to create, view, edit payments & invoices<br />
                  • Can create and edit credit notes and remittance advice<br />
                  • Cannot delete any financial records<br />
                  • Limited menu access: No Quotations (edit), Inventory, or User Management
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!allRolesSetup && (
              <Button
                variant="primary-gradient"
                size="lg"
                onClick={handleSetupRoles}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Setup Audit Roles
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={verifyRoles}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
          </div>

          {/* Next Steps */}
          {allRolesSetup && (
            <Alert className="bg-success-light/50 border-success/20">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                <p className="font-medium text-success mb-1">Audit roles are ready!</p>
                <p className="text-sm text-muted-foreground">
                  You can now create users with these roles in the User Management section. 
                  Go to User Management → Add User and select either "Sales Audit" or "Accounts Audit" as their role.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
