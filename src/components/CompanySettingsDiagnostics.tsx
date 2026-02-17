import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CompanySettingsDiagnosticsProps {
  currentCompany?: any;
}

export function CompanySettingsDiagnostics({ currentCompany }: CompanySettingsDiagnosticsProps) {
  const { profile: currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentUser) return null;

  // Verification checks
  const checks = {
    isAdmin: currentUser.role?.toLowerCase().includes('admin') || false,
    isActive: currentUser.status === 'active',
    hasCompanyId: !!currentUser.company_id,
    companyIdMatches: currentUser.company_id === currentCompany?.id,
    companyExists: !!currentCompany?.id,
  };

  const allChecksPassed = Object.values(checks).every(v => v === true);

  const getCheckStatus = (check: boolean) => {
    return check ? (
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        <span>✓</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="h-4 w-4" />
        <span>✗</span>
      </div>
    );
  };

  return (
    <Card className={`shadow-sm border-2 ${allChecksPassed ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allChecksPassed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <CardTitle className="text-base">Authorization Diagnostic</CardTitle>
          </div>
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
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* User Info Section */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Current User</h4>
            <div className="bg-background rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono">{currentUser.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={checks.isAdmin ? 'default' : 'secondary'}>
                  {currentUser.role || 'Not set'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={checks.isActive ? 'default' : 'destructive'}>
                  {currentUser.status || 'Not set'}
                </Badge>
              </div>
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-muted-foreground">Company ID:</span>
                <span>{currentUser.company_id || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Company Info Section */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Company Being Edited</h4>
            <div className="bg-background rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-mono">{currentCompany?.name || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-muted-foreground">Company ID:</span>
                <span>{currentCompany?.id || 'Loading...'}</span>
              </div>
              {currentCompany?.id && (
                <div className="flex justify-between items-center font-mono text-xs border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{currentCompany?.status || 'N/A'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Authorization Checks */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Authorization Checks</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-background rounded p-2">
                <span className="text-sm">User is Admin</span>
                {getCheckStatus(checks.isAdmin)}
              </div>
              <div className="flex items-center justify-between bg-background rounded p-2">
                <span className="text-sm">User is Active</span>
                {getCheckStatus(checks.isActive)}
              </div>
              <div className="flex items-center justify-between bg-background rounded p-2">
                <span className="text-sm">User has Company ID</span>
                {getCheckStatus(checks.hasCompanyId)}
              </div>
              <div className="flex items-center justify-between bg-background rounded p-2">
                <span className="text-sm">Company ID Matches</span>
                {getCheckStatus(checks.companyIdMatches)}
              </div>
              <div className="flex items-center justify-between bg-background rounded p-2">
                <span className="text-sm">Company Exists</span>
                {getCheckStatus(checks.companyExists)}
              </div>
            </div>
          </div>

          {/* Issues and Recommendations */}
          {!allChecksPassed && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3 space-y-2">
              <h4 className="font-semibold text-sm text-orange-900">Issues Found:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                {!checks.isAdmin && (
                  <li>• User role is not admin - must be assigned admin role</li>
                )}
                {!checks.isActive && (
                  <li>• User status is not active - contact administrator to activate account</li>
                )}
                {!checks.hasCompanyId && (
                  <li>• User is not assigned to a company - contact administrator to assign company</li>
                )}
                {!checks.companyIdMatches && (
                  <li>• User's company ID doesn't match the company being edited</li>
                )}
                {!checks.companyExists && (
                  <li>• Company data is not loaded - try refreshing the page</li>
                )}
              </ul>
            </div>
          )}

          {/* Debug Info */}
          <div className="space-y-2">
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                Debug Info (for developers)
              </summary>
              <div className="mt-2 bg-slate-100 dark:bg-slate-900 rounded p-2 font-mono overflow-auto max-h-40">
                <pre className="text-xs whitespace-pre-wrap break-words">
{`User: ${JSON.stringify({
  email: currentUser.email,
  role: currentUser.role,
  status: currentUser.status,
  company_id: currentUser.company_id,
}, null, 2)}

Company: ${JSON.stringify({
  id: currentCompany?.id,
  name: currentCompany?.name,
}, null, 2)}`}
                </pre>
              </div>
            </details>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
